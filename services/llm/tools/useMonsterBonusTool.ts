import { DiceKind } from '@/domain/shared';
import { CombatFlag, approachOnLine, hasFlag, withFlag } from '@/domain/combat';
import { abilityMod, Skill, skillBonus } from '@/domain/player';
import { bonusKindAllowed, getCatalogMonsterByKey, type TMonsterBonusKind } from '@/domain/monster';
import { encounterParticipantRepository, encounterRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import { spendAction } from '@/services/encounter/actionEconomy';
import type { IEncounterParticipant } from '@/domain/encounter';
import type { ILlmTool, IToolContext } from './types';

interface IUseMonsterBonusArgs {
  kind: TMonsterBonusKind;
  targetParticipantId?: string | null;
  feet?: number | null;
}

const KINDS = new Set<TMonsterBonusKind>(['disengage', 'hide', 'aggressive']);

const parseArgs = (args: unknown): IUseMonsterBonusArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы useMonsterBonus обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.kind !== 'string' || !KINDS.has(raw.kind as TMonsterBonusKind))
    throw new Error('kind должен быть disengage, hide или aggressive.');

  let feet: number | null = null;
  if (raw.feet !== undefined && raw.feet !== null) {
    if (typeof raw.feet !== 'number') throw new Error('feet должен быть числом.');
    if (!Number.isInteger(raw.feet)) throw new Error('feet должен быть целым числом.');
    if (raw.feet <= 0) throw new Error('feet должен быть положительным (>0).');
    feet = raw.feet;
  }

  return {
    kind: raw.kind as TMonsterBonusKind,
    targetParticipantId: typeof raw.targetParticipantId === 'string' ? raw.targetParticipantId.trim() || null : null,
    feet,
  };
};

const resolveTargetName = async (target: IEncounterParticipant): Promise<string> => {
  if (target.playerId) {
    const player = await playerRepository.getById(target.playerId);
    if (player) return player.name;
  }
  if (target.npcId) {
    const npc = await npcRepository.getById(target.npcId);
    if (npc) return npc.name;
  }
  if (target.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(target.monsterInstanceId);
    if (monster) return monster.name;
  }
  return 'неизвестная цель';
};

const setPosition = async (participantId: string, positionAfter: number, allParticipants: IEncounterParticipant[]) => {
  await encounterParticipantRepository.update(participantId, { positionFeet: positionAfter });
  const playerParticipant = allParticipants.find((p) => p.playerId);
  const playerPosition = playerParticipant?.positionFeet ?? 0;
  await encounterParticipantRepository.update(participantId, {
    feetFromPlayer: Math.abs(positionAfter - playerPosition),
  });
};

export const useMonsterBonusTool: ILlmTool = {
  name: 'use_monster_bonus',
  description:
    'Бонусное действие из черты справочника. kind=disengage (Отход, черта «Юркий») — тратит бонус, ставит Отход на этот ход. kind=hide (Засада, «Юркий») — проверка Скрытности против пассивной Внимательности игрока; при успехе монстр скрыт (атаки по нему с помехой, его следующая атака с преимуществом). kind=aggressive (черта «Агрессивный») — дополнительное перемещение к врагу до своей скорости, не тратит обычное движение. Нельзя вызвать без соответствующей черты. Бонусное действие одно на ход.',
  parameters: {
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: ['disengage', 'hide', 'aggressive'],
        description: 'disengage — Отход (Юркий); hide — Засада (Юркий); aggressive — рывок к врагу (Агрессивный)',
      },
      targetParticipantId: {
        type: 'string',
        description: 'ID цели. Обязателен для aggressive.',
      },
      feet: {
        type: 'number',
        description: 'Футы для aggressive (по умолчанию = скорость). Не тратит обычное движение.',
      },
    },
    required: ['kind'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.monsterInstanceId) throw new Error('monsterInstanceId отсутствует в контексте.');
    if (!ctx.encounterId) throw new Error('encounterId отсутствует в контексте.');

    const monster = await monsterInstanceRepository.getById(ctx.monsterInstanceId);
    if (!monster) throw new Error('Монстр не найден.');

    const catalog = getCatalogMonsterByKey(monster.catalogKey);
    if (!bonusKindAllowed(catalog.traits, parsed.kind)) {
      return {
        ok: false,
        errorCode: 'TRAIT_UNAVAILABLE',
        message: `Черта для бонуса «${parsed.kind}» отсутствует в справочнике (${monster.name}).`,
      };
    }

    const allParticipants = await encounterParticipantRepository.listByEncounterId(ctx.encounterId);
    const participant = allParticipants.find((p) => p.monsterInstanceId === monster.id);
    if (!participant) throw new Error('Участник монстра не найден в боевой сцене.');

    if (participant.isOut) throw new Error('MONSTER_OUT: Монстр выбыл из боя и не может действовать.');
    if (monster.hpCurrent <= 0) throw new Error('MONSTER_DOWN: Монстр без сознания (0 HP) и не может действовать.');

    const encounter = await encounterRepository.getById(ctx.encounterId);
    if (!encounter) throw new Error('Боевая сцена не найдена.');

    const orderedParticipants = [...allParticipants].sort((a, b) => a.order - b.order);
    const currentParticipant = orderedParticipants[encounter.currentTurnIndex];
    if (!currentParticipant || currentParticipant.id !== participant.id || currentParticipant.isOut)
      throw new Error('NOT_MONSTER_TURN: Сейчас не ход этого участника.');

    if (parsed.kind === 'disengage') {
      if (hasFlag(monster.conditions, CombatFlag.disengaged)) {
        return {
          ok: true,
          kind: 'disengage',
          already: true,
          trait: 'Юркий',
          message: `${monster.name} уже в Отходе в этот ход.`,
        };
      }

      const spendResult = await spendAction(participant.id, 'bonus');
      if (!spendResult.success) {
        return {
          ok: false,
          errorCode: spendResult.errorCode,
          message: 'Бонусное действие уже использовано в этом ходу.',
        };
      }

      await monsterInstanceRepository.update(monster.id, {
        conditions: withFlag(monster.conditions, CombatFlag.disengaged),
      });

      return {
        ok: true,
        kind: 'disengage',
        trait: 'Юркий',
        bonusActionUsed: true,
        message: `${monster.name} совершает Отход бонусным действием (Юркий).`,
      };
    }

    if (parsed.kind === 'hide') {
      if (hasFlag(monster.conditions, CombatFlag.hidden)) {
        return {
          ok: true,
          kind: 'hide',
          already: true,
          hidden: true,
          trait: 'Юркий',
          message: `${monster.name} уже скрыт.`,
        };
      }

      const spendResult = await spendAction(participant.id, 'bonus');
      if (!spendResult.success) {
        return {
          ok: false,
          errorCode: spendResult.errorCode,
          message: 'Бонусное действие уже использовано в этом ходу.',
        };
      }

      const dexMod = abilityMod(monster.dex);
      const pb = catalog.proficiencyBonus ?? 0;
      const stealthBonus = dexMod + pb;

      const stealthRoll = await rollDice({
        campaignId: ctx.campaignId,
        die: DiceKind.d20,
        note: `Засада: скрытность ${monster.name}`,
        npcId: null,
        playerId: null,
      });
      const stealthTotal = stealthRoll.value + stealthBonus;

      let dc = 10;
      const playerParticipant = allParticipants.find((p) => p.playerId && !p.isOut);
      if (playerParticipant?.playerId) {
        const player = await playerRepository.getById(playerParticipant.playerId);
        if (player) dc = 10 + skillBonus(player, Skill.perception);
      }

      const hidden = stealthTotal >= dc;
      if (hidden) {
        await monsterInstanceRepository.update(monster.id, {
          conditions: withFlag(monster.conditions, CombatFlag.hidden),
        });
      }

      return {
        ok: true,
        kind: 'hide',
        trait: 'Юркий',
        hidden,
        stealthRoll: stealthRoll.value,
        stealthBonus,
        stealthTotal,
        dc,
        bonusActionUsed: true,
        message: hidden
          ? `${monster.name} скрывается (Засада). Скрытность ${stealthTotal} против Сл ${dc}.`
          : `${monster.name} не смог скрыться. Скрытность ${stealthTotal} против Сл ${dc}.`,
      };
    }

    if (!parsed.targetParticipantId) {
      return {
        ok: false,
        errorCode: 'TARGET_REQUIRED',
        message: 'Для Агрессивного укажи targetParticipantId.',
      };
    }

    const target = allParticipants.find((p) => p.id === parsed.targetParticipantId);
    if (!target) throw new Error('Цель не найдена.');
    if (target.id === participant.id || target.monsterInstanceId) {
      return {
        ok: false,
        errorCode: 'INVALID_TARGET',
        message: 'Агрессивный можно использовать только против врага, не против союзника.',
      };
    }
    if (target.isOut) {
      return {
        ok: false,
        errorCode: 'TARGET_OUT',
        message: 'Цель уже выбыла из боя.',
      };
    }

    const move = approachOnLine({
      from: participant.positionFeet,
      target: target.positionFeet,
      maxFeet: parsed.feet ?? monster.speed,
    });

    if (move.movedFeet === 0) {
      return {
        ok: false,
        errorCode: 'ALREADY_IN_REACH',
        movedFeet: 0,
        distanceToTarget: move.distanceBefore,
        message: `${monster.name} уже в пределах 5 футов от цели — Агрессивный не даёт перемещения.`,
      };
    }

    const spendResult = await spendAction(participant.id, 'bonus');
    if (!spendResult.success) {
      return {
        ok: false,
        errorCode: spendResult.errorCode,
        message: 'Бонусное действие уже использовано в этом ходу.',
      };
    }

    await setPosition(participant.id, move.positionAfter, allParticipants);
    const targetName = await resolveTargetName(target);

    return {
      ok: true,
      kind: 'aggressive',
      trait: 'Агрессивный',
      movedFeet: move.movedFeet,
      positionBefore: participant.positionFeet,
      positionAfter: move.positionAfter,
      distanceToTarget: move.distanceAfter,
      targetName,
      bonusActionUsed: true,
      message: `${monster.name} срывается к ${targetName} на ${move.movedFeet} фт (Агрессивный).`,
    };
  },
};
