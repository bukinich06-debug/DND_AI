import { DiceKind } from '@/domain/shared';
import { encounterParticipantRepository, encounterRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import { spendAction } from '@/services/encounter/actionEconomy';
import { checkEncounterEnd } from '@/services/encounter/checkEncounterEnd';
import { rollAttackD20 } from '@/services/encounter/helpers/rollAttackD20';
import { loadPackFighters } from '@/services/encounter/helpers/loadPackFighters';
import {
  CombatFlag,
  combatSideOf,
  combineRollModes,
  hasFlag,
  hasPackTacticsAdvantage,
  withoutFlag,
} from '@/domain/combat';
import {
  CATALOG_TRAIT,
  getCatalogMonsterByKey,
  hasCatalogTrait,
  matchCatalogAction,
  isActionInRange,
  isRangedAtDistance,
  type IMonsterAction,
} from '@/domain/monster';
import { resolveCritical } from '@/services/encounter/helpers/resolveCritical';
import { syncUnconscious } from '@/domain/player/helpers/syncUnconscious';
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

const calculateAbilityMod = (score: number): number => Math.floor((score - 10) / 2);

const parseDamageFormula = (formula: string): { dieCount: number; die: DiceKind | null; bonus: number } => {
  const fixedOnlyMatch = formula.match(/^(\d+)$/);
  if (fixedOnlyMatch) {
    return { dieCount: 0, die: null, bonus: parseInt(fixedOnlyMatch[1], 10) };
  }

  const fixedPlusBonusMatch = formula.match(/^(\d+)\s*([+-])\s*(\d+)$/);
  if (fixedPlusBonusMatch) {
    const base = parseInt(fixedPlusBonusMatch[1], 10);
    const sign = fixedPlusBonusMatch[2];
    const bonusVal = parseInt(fixedPlusBonusMatch[3], 10);
    const total = sign === '+' ? base + bonusVal : base - bonusVal;
    return { dieCount: 0, die: null, bonus: total };
  }

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
    'Разрешает атаку монстра против цели: проверяет дистанцию (рукопашная ≤5 футов, дальнобойная ≤нормальная дистанция, метательная — рукопашная ≤5 или ≤нормальная), бросок атаки d20+бонус против AC цели; при попадании — бросок урона и применение к HP. Черта «Тактика стаи» и скрытие дают преимущество автоматически (два d20, берётся высший). Нельзя атаковать себя или других монстров (союзников). НЕ АТАКУЕТ цели с 0 HP, если монстр не имеет флага finishesDowned (добивающий). Атака по бессознательной цели в 5 футах = автоматический крит, попадание даёт +1 провал спасброска от смерти (крит +2). Автоматически помечает участника isOut, если HP<=0. Вернёт hit/miss, броски, новый HP цели или errorCode. attackName — название атаки из списка доступных действий монстра на русском языке (допускается короткое имя вроде «лук»). Если не указано и в каталоге есть действия — берётся первая атака, которая достаёт до цели; если ни одна не достаёт — OUT_OF_REACH. Если каталог пуст — простая рукопашная 1d6 + модификатор. Все параметры атаки (урон, бонус, дальность) берутся из каталога монстра по attackName. Монстр действует только от своего имени (monsterInstanceId берётся из контекста хода).',
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
          'Название атаки из списка доступных действий монстра на русском языке (например, "Короткий меч", "Укус", "лук"). Если не указано и в каталоге есть действия — первая атака в пределах дистанции; если ни одна не достаёт — ошибка дистанции; если каталог пуст — простая рукопашная атака.',
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

    let targetAc = 10;
    let targetHp = 0;
    let targetMaxHp = 0;
    let targetKind: 'player' | 'npc' | 'monster' = 'monster';
    let targetIsUnconscious = false;
    let targetName = 'Неизвестный';

    if (targetParticipant.playerId) {
      const player = await playerRepository.getById(targetParticipant.playerId);
      if (!player) throw new Error('Игрок не найден.');
      targetAc = player.ac;
      targetHp = player.hpCurrent;
      targetMaxHp = player.hpMax;
      targetName = player.name;
      targetKind = 'player';
      targetIsUnconscious = player.conditions.includes('unconscious');
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

    if (targetHp <= 0 && !isFinisher) {
      return {
        hit: false,
        errorCode: 'TARGET_DOWN',
        targetName,
        message: `${targetName} без сознания (0 HP). Монстр ${attacker.name} не добивает лежачих (нет флага finishesDowned).`,
      };
    }

    const distance = Math.abs(attackerParticipant.positionFeet - targetParticipant.positionFeet);

    const strMod = calculateAbilityMod(attacker.str);
    const dexMod = calculateAbilityMod(attacker.dex);
    const attackMod = Math.max(strMod, dexMod);
    const catalogActions = catalog.actions ?? [];
    let attackBonus = attackMod;
    let damageFormula = `1d6${attackMod >= 0 ? '+' : ''}${attackMod}`;
    let isRangedAttack = false;
    let normalRange: number | null = null;
    let chosenAttackName: string | null = null;

    const applyCatalogAction = (action: IMonsterAction) => {
      attackBonus = action.attackBonus ?? attackMod;
      damageFormula = action.damage ?? `1d6${attackMod >= 0 ? '+' : ''}${attackMod}`;
      isRangedAttack = isRangedAtDistance(action, distance);
      normalRange = action.rangeNormal ?? null;
      chosenAttackName = action.name;
    };

    if (parsed.attackName) {
      const action = matchCatalogAction(parsed.attackName, catalogActions);

      if (!action) {
        return {
          hit: false,
          errorCode: 'UNKNOWN_ACTION',
          message: `Действие "${parsed.attackName}" не найдено в каталоге монстра. Доступные действия: ${catalogActions.map((a) => a.name).join(', ') || 'нет'}.`,
        };
      }

      applyCatalogAction(action);
    } else if (catalogActions.length > 0) {
      const inRange = catalogActions.find((a) => isActionInRange(a, distance));
      if (!inRange) {
        return {
          hit: false,
          errorCode: 'OUT_OF_REACH',
          targetName,
          distance,
          message: `${targetName} находится слишком далеко ни для одной атаки из каталога (${distance} футов).`,
        };
      }
      applyCatalogAction(inRange);
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

    const spendResult = await spendAction(attackerParticipant.id, 'action');
    if (!spendResult.success) {
      return {
        hit: false,
        errorCode: spendResult.errorCode,
        message: 'Основное действие уже использовано в этом ходу.',
      };
    }

    const packTactics =
      hasCatalogTrait(catalog.traits, CATALOG_TRAIT.packTactics) &&
      hasPackTacticsAdvantage({
        attackerId: attackerParticipant.id,
        attackerSide: combatSideOf(attackerParticipant),
        targetId: targetParticipant.id,
        targetPositionFeet: targetParticipant.positionFeet,
        fighters: await loadPackFighters(allParticipants),
      });
    const attackerHidden = hasFlag(attacker.conditions, CombatFlag.hidden);
    const rollMode = combineRollModes(packTactics || attackerHidden, false);
    const advantageReasons: string[] = [];
    if (packTactics) advantageReasons.push('Тактика стаи');
    if (attackerHidden) advantageReasons.push('скрыт');

    const attackRoll = await rollAttackD20({
      campaignId: ctx.campaignId,
      note: `Атака монстра ${attacker.name} по ${targetName}${chosenAttackName ? ` (${chosenAttackName})` : ''}`,
      mode: rollMode,
    });

    if (attackerHidden) {
      await monsterInstanceRepository.update(attacker.id, {
        conditions: withoutFlag(attacker.conditions, CombatFlag.hidden),
      });
    }

    const attackTotal = attackRoll.value + attackBonus;

    const critResult = resolveCritical({
      attackRoll: attackRoll.value,
      attackTotal,
      targetAc,
      targetIsUnconscious: Boolean(targetIsUnconscious),
      isRangedAttack,
      distance,
    });

    const hit = critResult.hit;
    const isCritical = critResult.isCritical;
    const isNatural20 = critResult.isNatural20;
    const isNatural1 = critResult.isNatural1;

    let damageTotal = 0;
    const damageRolls: number[] = [];
    let deathSaveFailuresAdded = 0;

    if (hit) {
      const { dieCount, die, bonus } = parseDamageFormula(damageFormula);

      if (die === null) {
        damageTotal = bonus;
      } else {
        const effectiveDieCount = isCritical ? dieCount * 2 : dieCount;

        for (let i = 0; i < effectiveDieCount; i += 1) {
          const roll = await rollDice({
            campaignId: ctx.campaignId,
            die,
            note: `Урон монстра ${attacker.name} по ${targetName} (кубик ${i + 1})${isCritical ? ' [КРИТ]' : ''}`,
            npcId: null,
            playerId: null,
          });
          damageRolls.push(roll.value);
        }

        damageTotal = damageRolls.reduce((sum, val) => sum + val, 0) + bonus;
      }

      const newHp = Math.max(0, targetHp - damageTotal);

      if (targetKind === 'player' && targetParticipant.playerId) {
        const player = await playerRepository.getById(targetParticipant.playerId);
        if (player) {
          if (targetHp === 0 && targetIsUnconscious) {
            deathSaveFailuresAdded = isCritical ? 2 : 1;
            const newDeathSaveFail = Math.min(3, player.deathSaveFail + deathSaveFailuresAdded);
            const isDead = newDeathSaveFail >= 3;

            await playerRepository.update(targetParticipant.playerId, {
              deathSaveFail: newDeathSaveFail,
              dead: isDead,
            });

            if (isDead) {
              await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
            }
          } else {
            const massiveDamageThreshold = player.hpMax;
            const excessDamage = targetHp > 0 ? Math.max(0, damageTotal - targetHp) : 0;
            const instantDeath = newHp === 0 && excessDamage >= massiveDamageThreshold;

            const syncedState = syncUnconscious(newHp, {
              conditions: player.conditions,
              exhaustionLevel: player.exhaustionLevel,
            });

            if (player.isStable && newHp < player.hpCurrent) {
              await playerRepository.update(targetParticipant.playerId, {
                hpCurrent: newHp,
                dead: instantDeath,
                conditions: syncedState.conditions,
                isStable: false,
              });
            } else {
              await playerRepository.update(targetParticipant.playerId, {
                hpCurrent: newHp,
                dead: instantDeath,
                conditions: syncedState.conditions,
              });
            }

            if (instantDeath) {
              await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
            }
          }
        }
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

      if (newHp <= 0 && !targetParticipant.isOut && (targetKind === 'npc' || targetKind === 'monster')) {
        await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
      }

      if (ctx.encounterId) {
        await checkEncounterEnd({ encounterId: ctx.encounterId });
      }

      return {
        hit: true,
        isCritical,
        isNatural20,
        isNatural1: false,
        attackRoll: attackRoll.value,
        attackRolls: attackRoll.rolls,
        rollMode,
        advantageReasons,
        packTactics,
        revealedFromHide: attackerHidden,
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
        deathSaveFailuresAdded,
        attackName: chosenAttackName,
      };
    }

    return {
      hit: false,
      isCritical: false,
      isNatural20: false,
      isNatural1,
      attackRoll: attackRoll.value,
      attackRolls: attackRoll.rolls,
      rollMode,
      advantageReasons,
      packTactics,
      revealedFromHide: attackerHidden,
      attackBonus,
      attackTotal,
      targetAc,
      targetName,
      attackName: chosenAttackName,
    };
  },
};
