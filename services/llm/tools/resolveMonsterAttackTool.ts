import { encounterParticipantRepository, encounterRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { spendAction } from '@/services/encounter/actionEconomy';
import {
  expandMultiattack,
  getCatalogMonsterByKey,
  isActionInRange,
  isMultiattackAction,
  isRangedAtDistance,
  matchCatalogAction,
  pickDefaultAttack,
  type IMonsterAction,
} from '@/domain/monster';
import { performMonsterStrike } from '@/services/encounter/helpers/performMonsterStrike';
import { loadCombatTarget } from '@/services/encounter/helpers/applyStrikeDamage';
import type { IStrikeResult } from '@/services/encounter/helpers/strikeTypes';
import type { ILlmTool, IToolContext } from './types';

interface IResolveMonsterAttackArgs {
  targetParticipantId: string;
  attackName?: string | null;
}

const parseArgs = (args: unknown): IResolveMonsterAttackArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы resolveMonsterAttack обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.targetParticipantId !== 'string' || !raw.targetParticipantId.trim())
    throw new Error('targetParticipantId обязателен.');

  return {
    targetParticipantId: raw.targetParticipantId.trim(),
    attackName: typeof raw.attackName === 'string' ? raw.attackName.trim() || null : null,
  };
};

const outOfReach = (targetName: string, distance: number, extra?: string) => ({
  hit: false,
  errorCode: 'OUT_OF_REACH',
  targetName,
  distance,
  message: extra ?? `${targetName} находится слишком далеко (${distance} футов).`,
});

export const resolveMonsterAttackTool: ILlmTool = {
  name: 'resolve_monster_attack',
  description:
    'Разрешает атаку монстра против цели: дистанция, d20+бонус vs AC, урон. Если в справочнике есть «Мультиатака» — одно Действие делает все положенные атаки (каждая со своим броском). Не атакуй себя и союзных монстров. Не атакуй цели с 0 HP без finishesDowned. Тактика стаи и скрытие дают преимущество сами. attackName — название из справочника (в т.ч. «Мультиатака»). Если не указано — мультиатака, если она достаёт, иначе первая атака в пределах дистанции.',
  parameters: {
    type: 'object',
    properties: {
      targetParticipantId: {
        type: 'string',
        description: 'ID участника боя — цели атаки',
      },
      attackName: {
        type: 'string',
        description:
          'Название атаки из справочника (например, «Короткий меч», «Мультиатака»). Если не указано — мультиатака при досягаемости, иначе первая атака в пределах дистанции.',
      },
    },
    required: ['targetParticipantId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.monsterInstanceId) throw new Error('monsterInstanceId отсутствует в контексте.');
    if (!ctx.encounterId) throw new Error('encounterId отсутствует в контексте.');

    const attacker = await monsterInstanceRepository.getById(ctx.monsterInstanceId);
    if (!attacker) throw new Error('Атакующий монстр не найден.');

    const catalog = getCatalogMonsterByKey(attacker.catalogKey);
    const isFinisher = catalog?.finishesDowned ?? false;
    const catalogActions = catalog.actions ?? [];

    const allParticipants = await encounterParticipantRepository.listByEncounterId(ctx.encounterId);
    const attackerParticipant = allParticipants.find((p) => p.monsterInstanceId === attacker.id);
    if (!attackerParticipant) throw new Error('Участник атакующего монстра не найден в боевой сцене.');

    const encounter = await encounterRepository.getById(ctx.encounterId);
    if (!encounter) throw new Error('Боевая сцена не найдена.');

    const orderedParticipants = [...allParticipants].sort((a, b) => a.order - b.order);
    const currentParticipant = orderedParticipants[encounter.currentTurnIndex];
    if (!currentParticipant || currentParticipant.id !== attackerParticipant.id || currentParticipant.isOut)
      throw new Error('FORBIDDEN: Монстр может атаковать только в свой ход.');

    if (attackerParticipant.isOut)
      throw new Error('MONSTER_OUT: Атакующий монстр выбыл из боя и не может действовать.');
    if (attacker.hpCurrent <= 0) throw new Error('MONSTER_DOWN: Монстр без сознания (0 HP) и не может атаковать.');

    const targetParticipant = await encounterParticipantRepository.getById(parsed.targetParticipantId);
    if (!targetParticipant) throw new Error('Участник боя не найден.');

    if (targetParticipant.isOut) {
      return {
        hit: false,
        errorCode: 'TARGET_OUT',
        message: 'Цель уже выбыла из боя и не может быть атакована.',
      };
    }

    if (targetParticipant.id === attackerParticipant.id || targetParticipant.monsterInstanceId === attacker.id) {
      return {
        hit: false,
        errorCode: 'INVALID_TARGET',
        message: 'Нельзя атаковать самого себя.',
      };
    }

    if (targetParticipant.monsterInstanceId) {
      return {
        hit: false,
        errorCode: 'ALLIED_TARGET',
        message: 'Нельзя атаковать союзного монстра.',
      };
    }

    const target = await loadCombatTarget(targetParticipant);
    if (target.hp <= 0 && !isFinisher) {
      return {
        hit: false,
        errorCode: 'TARGET_DOWN',
        targetName: target.name,
        message: `${target.name} без сознания (0 HP). Монстр ${attacker.name} не добивает лежачих (нет флага finishesDowned).`,
      };
    }

    const distance = Math.abs(attackerParticipant.positionFeet - targetParticipant.positionFeet);

    let chosen: IMonsterAction | null = null;
    if (parsed.attackName) {
      const action = matchCatalogAction(parsed.attackName, catalogActions);
      if (!action) {
        return {
          hit: false,
          errorCode: 'UNKNOWN_ACTION',
          message: `Действие "${parsed.attackName}" не найдено в каталоге монстра. Доступные действия: ${catalogActions.map((a) => a.name).join(', ') || 'нет'}.`,
        };
      }
      chosen = action;
    } else if (catalogActions.length > 0) {
      chosen = pickDefaultAttack(catalogActions, distance);
      if (!chosen) {
        return outOfReach(
          target.name,
          distance,
          `${target.name} находится слишком далеко ни для одной атаки из каталога (${distance} футов).`
        );
      }
    }

    const strikeParams = {
      campaignId: ctx.campaignId,
      encounterId: ctx.encounterId,
      attacker,
      attackerParticipant,
      targetParticipant,
      allParticipants,
    };

    if (chosen && isMultiattackAction(chosen)) {
      const parts = expandMultiattack(chosen, catalogActions);
      const inRange = parts.filter((p) => isActionInRange(p, distance));
      if (inRange.length === 0) {
        return outOfReach(
          target.name,
          distance,
          `${target.name} находится слишком далеко для мультиатаки (${distance} футов).`
        );
      }

      const spendResult = await spendAction(attackerParticipant.id, 'action');
      if (!spendResult.success) {
        return {
          hit: false,
          errorCode: spendResult.errorCode,
          message: 'Основное действие уже использовано в этом ходу.',
        };
      }

      const strikes: IStrikeResult[] = [];
      for (const part of inRange) {
        const freshTarget = await encounterParticipantRepository.getById(targetParticipant.id);
        if (!freshTarget || freshTarget.isOut) break;
        const live = await loadCombatTarget(freshTarget);
        if (live.hp <= 0 && !isFinisher) break;

        strikes.push(
          await performMonsterStrike({
            ...strikeParams,
            targetParticipant: freshTarget,
            action: part,
          })
        );
      }

      const last = strikes.at(-1);
      return {
        ...(last ?? {}),
        multiattack: true,
        attackName: chosen.name,
        strikes,
        hit: strikes.some((s) => s.hit),
        attackerName: attacker.name,
        targetName: target.name,
      };
    }

    if (chosen) {
      const ranged = isRangedAtDistance(chosen, distance);
      if (!ranged && distance > 5) {
        return outOfReach(
          target.name,
          distance,
          `${target.name} находится слишком далеко для рукопашной атаки (${distance} футов, требуется ≤5 футов)`
        );
      }
      if (ranged && chosen.rangeNormal != null && distance > chosen.rangeNormal) {
        return outOfReach(
          target.name,
          distance,
          `${target.name} находится слишком далеко для дальнобойной атаки (${distance} футов, нормальная дистанция ${chosen.rangeNormal} футов)`
        );
      }
    } else if (distance > 5) {
      return outOfReach(
        target.name,
        distance,
        `${target.name} находится слишком далеко для рукопашной атаки (${distance} футов, требуется ≤5 футов)`
      );
    }

    const spendResult = await spendAction(attackerParticipant.id, 'action');
    if (!spendResult.success) {
      return {
        hit: false,
        errorCode: spendResult.errorCode,
        message: 'Основное действие уже использовано в этом ходу.',
      };
    }

    return performMonsterStrike({
      ...strikeParams,
      action: chosen,
    });
  },
};
