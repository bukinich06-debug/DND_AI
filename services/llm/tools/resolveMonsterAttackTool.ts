import { DiceKind } from '@/domain/shared';
import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import type { ILlmTool, IToolContext } from './types';

interface IResolveMonsterAttackArgs {
  attackerMonsterInstanceId: string;
  targetParticipantId: string;
  attackName?: string | null;
  attackBonus?: number | null;
  damageFormula?: string | null;
  isRanged?: boolean | null;
}

const parseArgs = (args: unknown): IResolveMonsterAttackArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы resolveMonsterAttack обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.attackerMonsterInstanceId !== 'string' || !raw.attackerMonsterInstanceId.trim())
    throw new Error('attackerMonsterInstanceId обязателен.');
  if (typeof raw.targetParticipantId !== 'string' || !raw.targetParticipantId.trim())
    throw new Error('targetParticipantId обязателен.');

  return {
    attackerMonsterInstanceId: raw.attackerMonsterInstanceId.trim(),
    targetParticipantId: raw.targetParticipantId.trim(),
    attackName: (raw.attackName as string | null | undefined) ?? null,
    attackBonus: (raw.attackBonus as number | null | undefined) ?? null,
    damageFormula: (raw.damageFormula as string | null | undefined) ?? null,
    isRanged: (raw.isRanged as boolean | null | undefined) ?? null,
  };
};

const calculateAbilityMod = (score: number): number => Math.floor((score - 10) / 2);

const parseDamageFormula = (formula: string): { dieCount: number; die: DiceKind; bonus: number } => {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) throw new Error(`Некорректная формула урона: ${formula}`);

  const dieCount = parseInt(match[1], 10);
  const dieValue = parseInt(match[2], 10);
  const bonus = match[3] ? parseInt(match[3], 10) : 0;

  const dieMap: Record<number, DiceKind> = {
    4: DiceKind.d4,
    6: DiceKind.d6,
    8: DiceKind.d8,
    10: DiceKind.d10,
    12: DiceKind.d12,
    20: DiceKind.d20,
  };

  const die = dieMap[dieValue];
  if (!die) throw new Error(`Неподдерживаемый кубик: d${dieValue}`);

  return { dieCount, die, bonus };
};

export const resolveMonsterAttackTool: ILlmTool = {
  name: 'resolve_monster_attack',
  description:
    'Разрешает атаку монстра против цели: проверяет дистанцию (рукопашная ≤5 футов, дальнобойная ≤нормальная дистанция), бросок атаки d20+бонус против AC цели; при попадании — бросок урона и применение к HP. Автоматически помечает участника isOut, если HP<=0. Вернёт hit/miss, броски, новый HP цели или errorCode: "OUT_OF_REACH" если цель слишком далеко. Если attackName не указан, используется простая рукопашная атака (d20 + STR/DEX mod vs AC, урон 1d6 + mod). Можешь передать attackBonus, damageFormula и isRanged для конкретной атаки из actions.',
  parameters: {
    type: 'object',
    properties: {
      attackerMonsterInstanceId: {
        type: 'string',
        description: 'ID экземпляра атакующего монстра',
      },
      targetParticipantId: {
        type: 'string',
        description: 'ID участника боя — цели атаки',
      },
      attackName: {
        type: 'string',
        description: 'Название атаки (например, "Короткий меч")',
      },
      attackBonus: {
        type: 'number',
        description: 'Бонус к броску атаки. Если не указан, используется STR или DEX mod',
      },
      damageFormula: {
        type: 'string',
        description: 'Формула урона (например, "1d6+2"). Если не указана, используется 1d6 + mod',
      },
      isRanged: {
        type: 'boolean',
        description: 'Является ли атака дальнобойной (лук, арбалет). Если true, проверяется дистанция по описанию атаки',
      },
    },
    required: ['attackerMonsterInstanceId', 'targetParticipantId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const attacker = await monsterInstanceRepository.getById(parsed.attackerMonsterInstanceId);
    if (!attacker) throw new Error('Атакующий монстр не найден.');

    const targetParticipant = await encounterParticipantRepository.getById(parsed.targetParticipantId);
    if (!targetParticipant) throw new Error('Участник боя не найден.');

    const attackerParticipants = await encounterParticipantRepository.listByEncounterId(
      targetParticipant.encounterId
    );
    const attackerParticipant = attackerParticipants.find((p) => p.monsterInstanceId === attacker.id);
    if (!attackerParticipant) throw new Error('Участник атакующего монстра не найден в боевой сцене.');

    const isRangedAttack =
      parsed.isRanged === true ||
      (parsed.attackName &&
        (parsed.attackName.toLowerCase().includes('лук') ||
          parsed.attackName.toLowerCase().includes('арбалет') ||
          parsed.attackName.toLowerCase().includes('метательн') ||
          parsed.attackName.toLowerCase().includes('дальнобойн')));

    let distance = 0;
    let targetName = 'Неизвестный';

    if (targetParticipant.playerId) {
      const player = await playerRepository.getById(targetParticipant.playerId);
      if (player) targetName = player.name;
      distance = attackerParticipant.feetFromPlayer;
    } else if (targetParticipant.npcId) {
      const npc = await npcRepository.getById(targetParticipant.npcId);
      if (npc) targetName = npc.name;
      distance = Math.abs(attackerParticipant.feetFromPlayer - targetParticipant.feetFromPlayer);
    } else if (targetParticipant.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(targetParticipant.monsterInstanceId);
      if (monster) targetName = monster.name;
      distance = Math.abs(attackerParticipant.feetFromPlayer - targetParticipant.feetFromPlayer);
    }

    if (!isRangedAttack && distance > 5) {
      return {
        hit: false,
        errorCode: 'OUT_OF_REACH',
        targetName,
        distance,
        message: `${targetName} находится слишком далеко для рукопашной атаки (${distance} футов, требуется ≤5 футов)`,
      };
    }

    if (isRangedAttack) {
      const rangeMatch = parsed.attackName?.match(/(\d+)\/(\d+)\s*фут/);
      let normalRange = 80;
      if (rangeMatch) normalRange = parseInt(rangeMatch[1], 10);

      if (distance > normalRange) {
        return {
          hit: false,
          errorCode: 'OUT_OF_REACH',
          targetName,
          distance,
          message: `${targetName} находится слишком далеко для дальнобойной атаки (${distance} футов, нормальная дистанция ${normalRange} футов)`,
        };
      }
    }

    let targetAc = 10;
    let targetHp = 0;
    let targetMaxHp = 0;
    let targetKind: 'player' | 'npc' | 'monster' = 'monster';

    if (targetParticipant.playerId) {
      const player = await playerRepository.getById(targetParticipant.playerId);
      if (!player) throw new Error('Игрок не найден.');
      targetAc = player.ac;
      targetHp = player.hpCurrent;
      targetMaxHp = player.hpMax;
      targetName = player.name;
      targetKind = 'player';
    } else if (targetParticipant.npcId) {
      const npc = await npcRepository.getById(targetParticipant.npcId);
      if (!npc) throw new Error('NPC не найден.');
      const statBlock = await npcStatBlockRepository.getByNpcId(targetParticipant.npcId);
      if (!statBlock) throw new Error('NPC статблок не найден.');
      targetAc = statBlock.ac;
      targetHp = statBlock.hpCurrent;
      targetMaxHp = statBlock.hpMax;
      targetName = npc.name;
      targetKind = 'npc';
    } else if (targetParticipant.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(targetParticipant.monsterInstanceId);
      if (!monster) throw new Error('Монстр-цель не найден.');
      targetAc = monster.ac;
      targetHp = monster.hpCurrent;
      targetMaxHp = monster.hpMax;
      targetName = monster.name;
      targetKind = 'monster';
    } else {
      throw new Error('Участник боя не имеет привязанной сущности.');
    }

    const strMod = calculateAbilityMod(attacker.str);
    const dexMod = calculateAbilityMod(attacker.dex);
    const attackMod = Math.max(strMod, dexMod);

    const attackBonus = parsed.attackBonus ?? attackMod;
    const damageFormula = parsed.damageFormula ?? `1d6${attackMod >= 0 ? '+' : ''}${attackMod}`;

    const attackRoll = await rollDice({
      campaignId: ctx.campaignId,
      die: DiceKind.d20,
      note: `Атака монстра ${attacker.name} по ${targetName}${parsed.attackName ? ` (${parsed.attackName})` : ''}`,
      npcId: null,
      playerId: null,
    });

    const attackTotal = attackRoll.value + attackBonus;
    const hit = attackTotal >= targetAc;

    let damageTotal = 0;
    let damageRolls: number[] = [];

    if (hit) {
      const { dieCount, die, bonus } = parseDamageFormula(damageFormula);

      for (let i = 0; i < dieCount; i += 1) {
        const roll = await rollDice({
          campaignId: ctx.campaignId,
          die,
          note: `Урон монстра ${attacker.name} по ${targetName} (кубик ${i + 1})`,
          npcId: null,
          playerId: null,
        });
        damageRolls.push(roll.value);
      }

      damageTotal = damageRolls.reduce((sum, val) => sum + val, 0) + bonus;

      const newHp = Math.max(0, targetHp - damageTotal);

      if (targetKind === 'player' && targetParticipant.playerId) {
        await playerRepository.update(targetParticipant.playerId, { hpCurrent: newHp });
      } else if (targetKind === 'npc' && targetParticipant.npcId) {
        const statBlock = await npcStatBlockRepository.getByNpcId(targetParticipant.npcId);
        if (statBlock) {
          await npcStatBlockRepository.upsert({
            npcId: targetParticipant.npcId,
            size: statBlock.size,
            creatureType: statBlock.creatureType,
            challengeRating: statBlock.challengeRating,
            proficiencyBonus: statBlock.proficiencyBonus,
            str: statBlock.str,
            dex: statBlock.dex,
            con: statBlock.con,
            int: statBlock.int,
            wis: statBlock.wis,
            cha: statBlock.cha,
            hpMax: statBlock.hpMax,
            hpCurrent: newHp,
            ac: statBlock.ac,
            speed: statBlock.speed,
            initiativeBonus: statBlock.initiativeBonus,
            saveProf: statBlock.saveProf,
            resistances: statBlock.resistances,
            immunities: statBlock.immunities,
            vulnerabilities: statBlock.vulnerabilities,
            conditionImmunities: statBlock.conditionImmunities,
            senses: statBlock.senses,
            languages: statBlock.languages,
            traits: statBlock.traits,
            actions: statBlock.actions,
            reactions: statBlock.reactions,
            legendaryActions: statBlock.legendaryActions,
          });
        }
      } else if (targetKind === 'monster' && targetParticipant.monsterInstanceId) {
        await monsterInstanceRepository.update(targetParticipant.monsterInstanceId, { hpCurrent: newHp });
      }

      if (newHp <= 0 && !targetParticipant.isOut) {
        await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
      }

      return {
        hit: true,
        attackRoll: attackRoll.value,
        attackBonus,
        attackTotal,
        targetAc,
        damageFormula,
        damageRolls,
        damageBonus: parseDamageFormula(damageFormula).bonus,
        damageTotal,
        targetName,
        targetPreviousHp: targetHp,
        targetNewHp: newHp,
        targetMaxHp,
        targetIsOut: newHp <= 0,
        attackName: parsed.attackName,
      };
    }

    return {
      hit: false,
      attackRoll: attackRoll.value,
      attackBonus,
      attackTotal,
      targetAc,
      targetName,
      attackName: parsed.attackName,
    };
  },
};
