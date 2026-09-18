import { DiceKind } from '@/domain/shared';
import { encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { itemRepository } from '@/data/item';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import type { ILlmTool, IToolContext } from './types';

interface IResolvePlayerAttackArgs {
  attackerPlayerId: string;
  targetParticipantId: string;
  weaponItemId?: string | null;
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
    weaponItemId: (raw.weaponItemId as string | null | undefined) ?? null,
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
    'Разрешает атаку игрока против цели. Автоматически проверяет дистанцию (рукопашная ≤5 футов, дальнобойная ≤rangeNormal), бросок атаки d20+бонус против AC цели; при попадании — бросок урона и применение к HP. Автоматически помечает участника isOut, если HP<=0. Вернёт hit/miss, броски, новый HP цели или errorCode: "OUT_OF_REACH" если цель слишком далеко, "UNKNOWN_WEAPON" если оружие не найдено или не принадлежит игроку. Если weaponItemId не указан, используется безоружная атака (d20 + STR mod vs AC, урон 1 + STR mod). Все параметры оружия (урон, дистанция, бонус) берутся из БД, не передавай их вручную.',
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
      weaponItemId: {
        type: 'string',
        description: 'ID предмета-оружия из инвентаря игрока (из списка экипированного оружия). Если не указан, используется безоружная атака.',
      },
    },
    required: ['attackerPlayerId', 'targetParticipantId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.playerId) throw new Error('playerId отсутствует в контексте.');
    if (parsed.attackerPlayerId !== ctx.playerId)
      throw new Error('FORBIDDEN: Нельзя атаковать от имени другого игрока.');

    const attacker = await playerRepository.getById(parsed.attackerPlayerId);
    if (!attacker) throw new Error('Атакующий игрок не найден.');

    if (attacker.dead) throw new Error('PLAYER_DEAD: Игрок мёртв и не может действовать.');

    const blockingConditions = ['unconscious', 'paralyzed', 'stunned', 'incapacitated', 'petrified'];
    const hasBlockingCondition = attacker.conditions.some((c) => blockingConditions.includes(c.toLowerCase()));
    if (hasBlockingCondition)
      throw new Error('PLAYER_INCAPACITATED: Игрок не может атаковать из-за состояния (unconscious/paralyzed/stunned/incapacitated/petrified).');

    if (attacker.exhaustionLevel >= 6)
      throw new Error('PLAYER_EXHAUSTED: Игрок истощён до смерти (exhaustion 6).');

    const targetParticipant = await encounterParticipantRepository.getById(parsed.targetParticipantId);
    if (!targetParticipant) throw new Error('Участник боя не найден.');

    if (targetParticipant.playerId === parsed.attackerPlayerId)
      throw new Error('INVALID_TARGET: Нельзя атаковать самого себя.');

    if (targetParticipant.isOut)
      throw new Error('INVALID_TARGET: Цель уже выбыла из боя.');

    let weaponName = 'Безоружная атака';
    let isRangedAttack = false;
    let normalRange: number | null = null;
    let damageFormula = `1${calculateAbilityMod(attacker.str) >= 0 ? '+' : ''}${calculateAbilityMod(attacker.str)}`;
    let attackBonus = calculateAbilityMod(attacker.str) + attacker.proficiencyBonus;

    if (parsed.weaponItemId) {
      const item = await itemRepository.getById(parsed.weaponItemId);

      if (!item) {
        return {
          hit: false,
          errorCode: 'UNKNOWN_WEAPON',
          message: 'Оружие не найдено в базе данных.',
        };
      }

      if (item.playerId !== parsed.attackerPlayerId) {
        return {
          hit: false,
          errorCode: 'UNKNOWN_WEAPON',
          message: 'Оружие не принадлежит этому игроку.',
        };
      }

      if (!item.equipSlot || (item.equipSlot !== 'mainHand' && item.equipSlot !== 'offHand')) {
        return {
          hit: false,
          errorCode: 'WEAPON_NOT_EQUIPPED',
          message: 'Оружие не экипировано (должно быть в mainHand или offHand).',
        };
      }

      weaponName = item.name;

      const props = item.properties ?? [];
      const damageProp = props.find((p) => p.type === 'damage');
      const rangeProp = props.find((p) => p.type === 'range');

      if (rangeProp && rangeProp.type === 'range') {
        isRangedAttack = true;
        normalRange = rangeProp.normal;
        attackBonus = calculateAbilityMod(attacker.dex) + attacker.proficiencyBonus;
      } else {
        const strMod = calculateAbilityMod(attacker.str);
        const dexMod = calculateAbilityMod(attacker.dex);
        attackBonus = Math.max(strMod, dexMod) + attacker.proficiencyBonus;
      }

      if (damageProp && damageProp.type === 'damage') {
        const abilityMod = isRangedAttack
          ? calculateAbilityMod(attacker.dex)
          : Math.max(calculateAbilityMod(attacker.str), calculateAbilityMod(attacker.dex));
        damageFormula = `${damageProp.dice}${abilityMod >= 0 ? '+' : ''}${abilityMod}`;
      }
    }

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

    if (isRangedAttack && normalRange !== null && distance > normalRange) {
      return {
        hit: false,
        errorCode: 'OUT_OF_REACH',
        targetName,
        distance,
        message: `${targetName} находится слишком далеко для дальнобойной атаки (${distance} футов, нормальная дистанция ${normalRange} футов)`,
      };
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

    const attackRoll = await rollDice({
      campaignId: ctx.campaignId,
      die: DiceKind.d20,
      note: `Атака игрока ${attacker.name} по ${targetName} (${weaponName})`,
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

      if (ctx.encounterId) {
        await encounterLogRepository.create({
          encounterId: ctx.encounterId,
          actorName: attacker.name,
          message: `атакует ${targetName} (${weaponName}): попадание! Урон ${damageTotal}, HP цели ${targetHp} → ${newHp}${newHp <= 0 ? ' [ВЫБЫЛ]' : ''}`,
          meta: {
            attackRoll: attackRoll.value,
            attackBonus,
            attackTotal,
            targetAc,
            damageFormula,
            damageRolls,
            damageTotal,
            targetPreviousHp: targetHp,
            targetNewHp: newHp,
          },
        });
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
        weaponName,
      };
    }

    if (ctx.encounterId) {
      await encounterLogRepository.create({
        encounterId: ctx.encounterId,
        actorName: attacker.name,
        message: `атакует ${targetName} (${weaponName}): промах (${attackTotal} vs AC ${targetAc})`,
        meta: {
          attackRoll: attackRoll.value,
          attackBonus,
          attackTotal,
          targetAc,
        },
      });
    }

    return {
      hit: false,
      attackRoll: attackRoll.value,
      attackBonus,
      attackTotal,
      targetAc,
      targetName,
      weaponName,
    };
  },
};
