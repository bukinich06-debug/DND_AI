import { DiceKind } from '@/domain/shared';
import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import type { ILlmTool, IToolContext } from './types';

interface IResolvePlayerAttackArgs {
  attackerPlayerId: string;
  targetParticipantId: string;
  weaponName?: string | null;
  attackBonus?: number | null;
  damageFormula?: string | null;
  isRanged?: boolean | null;
  rangeNormal?: number | null;
}

const parseArgs = (args: unknown): IResolvePlayerAttackArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы resolvePlayerAttack обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.attackerPlayerId !== 'string' || !raw.attackerPlayerId.trim())
    throw new Error('attackerPlayerId обязателен.');
  if (typeof raw.targetParticipantId !== 'string' || !raw.targetParticipantId.trim())
    throw new Error('targetParticipantId обязателен.');

  return {
    attackerPlayerId: raw.attackerPlayerId.trim(),
    targetParticipantId: raw.targetParticipantId.trim(),
    weaponName: (raw.weaponName as string | null | undefined) ?? null,
    attackBonus: (raw.attackBonus as number | null | undefined) ?? null,
    damageFormula: (raw.damageFormula as string | null | undefined) ?? null,
    isRanged: (raw.isRanged as boolean | null | undefined) ?? null,
    rangeNormal: (raw.rangeNormal as number | null | undefined) ?? null,
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

export const resolvePlayerAttackTool: ILlmTool = {
  name: 'resolve_player_attack',
  description:
    'Разрешает атаку игрока против цели: проверяет дистанцию (рукопашная ≤5 футов, дальнобойная ≤rangeNormal), бросок атаки d20+бонус против AC цели; при попадании — бросок урона и применение к HP. Автоматически помечает участника isOut, если HP<=0. Вернёт hit/miss, броски, новый HP цели или errorCode: "OUT_OF_REACH" если цель слишком далеко. Если weaponName не указан, используется простая рукопашная атака без оружия (d20 + STR mod vs AC, урон 1 + STR mod). Можешь передать attackBonus, damageFormula, isRanged и rangeNormal для конкретной атаки оружием.',
  parameters: {
    type: 'object',
    properties: {
      attackerPlayerId: {
        type: 'string',
        description: 'ID атакующего игрока',
      },
      targetParticipantId: {
        type: 'string',
        description: 'ID участника боя — цели атаки',
      },
      weaponName: {
        type: 'string',
        description: 'Название оружия (например, "Короткий меч", "Длинный лук")',
      },
      attackBonus: {
        type: 'number',
        description: 'Бонус к броску атаки. Если не указан, используется STR или DEX mod + proficiency',
      },
      damageFormula: {
        type: 'string',
        description: 'Формула урона (например, "1d8+3"). Если не указана, используется 1+STR mod',
      },
      isRanged: {
        type: 'boolean',
        description: 'Является ли атака дальнобойной (лук, арбалет). Если true, проверяется rangeNormal',
      },
      rangeNormal: {
        type: 'number',
        description: 'Нормальная дистанция дальнобойного оружия в футах (например, 80 для короткого лука)',
      },
    },
    required: ['attackerPlayerId', 'targetParticipantId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const attacker = await playerRepository.getById(parsed.attackerPlayerId);
    if (!attacker) throw new Error('Атакующий игрок не найден.');

    const targetParticipant = await encounterParticipantRepository.getById(parsed.targetParticipantId);
    if (!targetParticipant) throw new Error('Участник боя не найден.');

    const isRangedAttack = parsed.isRanged === true;
    const distance = targetParticipant.feetFromPlayer;

    let targetName = 'Неизвестный';

    if (targetParticipant.playerId) {
      const player = await playerRepository.getById(targetParticipant.playerId);
      if (player) targetName = player.name;
    } else if (targetParticipant.npcId) {
      const npc = await npcRepository.getById(targetParticipant.npcId);
      if (npc) targetName = npc.name;
    } else if (targetParticipant.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(targetParticipant.monsterInstanceId);
      if (monster) targetName = monster.name;
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
      const normalRange = parsed.rangeNormal ?? 80;

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
    const attackMod = isRangedAttack ? dexMod : Math.max(strMod, dexMod);

    const attackBonus = parsed.attackBonus ?? attackMod + attacker.proficiencyBonus;
    const damageFormula = parsed.damageFormula ?? `1${strMod >= 0 ? '+' : ''}${strMod}`;

    const attackRoll = await rollDice({
      campaignId: ctx.campaignId,
      die: DiceKind.d20,
      note: `Атака игрока ${attacker.name} по ${targetName}${parsed.weaponName ? ` (${parsed.weaponName})` : ''}`,
      npcId: null,
      playerId: attacker.id,
    });

    const attackTotal = attackRoll.value + attackBonus;
    const hit = attackTotal >= targetAc;

    let damageTotal = 0;
    let damageRolls: number[] = [];

    if (hit) {
      const parsedDamage = parseDamageFormula(damageFormula);
      const { dieCount, die, bonus } = parsedDamage;

      for (let i = 0; i < dieCount; i += 1) {
        const roll = await rollDice({
          campaignId: ctx.campaignId,
          die,
          note: `Урон игрока ${attacker.name} по ${targetName} (кубик ${i + 1})`,
          npcId: null,
          playerId: attacker.id,
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
        damageBonus: parsedDamage.bonus,
        damageTotal,
        targetName,
        targetPreviousHp: targetHp,
        targetNewHp: newHp,
        targetMaxHp,
        targetIsOut: newHp <= 0,
        weaponName: parsed.weaponName,
      };
    }

    return {
      hit: false,
      attackRoll: attackRoll.value,
      attackBonus,
      attackTotal,
      targetAc,
      targetName,
      weaponName: parsed.weaponName,
    };
  },
};
