import { monsterInstanceRepository } from '@/data/monster';
import {
  CombatFlag,
  combatSideOf,
  combineRollModes,
  hasFlag,
  hasPackTacticsAdvantage,
  resolveStrikeDamageType,
  withoutFlag,
} from '@/domain/combat';
import type { IEncounterParticipant } from '@/domain/encounter';
import {
  CATALOG_TRAIT,
  getCatalogMonsterByKey,
  hasCatalogTrait,
  isRangedAtDistance,
  type IMonsterAction,
  type IMonsterInstance,
} from '@/domain/monster';
import { abilityMod } from '@/domain/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import { checkEncounterEnd } from '@/services/encounter/checkEncounterEnd';
import { loadPackFighters } from '@/services/encounter/helpers/loadPackFighters';
import { resolveCritical } from '@/services/encounter/helpers/resolveCritical';
import { rollAttackD20 } from '@/services/encounter/helpers/rollAttackD20';
import { applyStrikeDamage, loadCombatTarget } from '@/services/encounter/helpers/applyStrikeDamage';
import { parseDamageFormula } from '@/services/encounter/helpers/parseDamageFormula';
import type { IStrikeResult } from '@/services/encounter/helpers/strikeTypes';

interface IPerformMonsterStrikeParams {
  campaignId: string;
  encounterId: string;
  attacker: IMonsterInstance;
  attackerParticipant: IEncounterParticipant;
  targetParticipant: IEncounterParticipant;
  allParticipants: IEncounterParticipant[];
  action: IMonsterAction | null;
  isOpportunityAttack?: boolean;
}

export const performMonsterStrike = async ({
  campaignId,
  encounterId,
  attacker,
  attackerParticipant,
  targetParticipant,
  allParticipants,
  action,
  isOpportunityAttack = false,
}: IPerformMonsterStrikeParams): Promise<IStrikeResult> => {
  const target = await loadCombatTarget(targetParticipant);
  const distance = Math.abs(attackerParticipant.positionFeet - targetParticipant.positionFeet);

  const attackMod = Math.max(abilityMod(attacker.str), abilityMod(attacker.dex));
  let attackBonus = attackMod;
  let damageFormula = `1d6${attackMod >= 0 ? '+' : ''}${attackMod}`;
  let isRangedAttack = false;
  let chosenAttackName: string | null = null;

  if (action) {
    attackBonus = action.attackBonus ?? attackMod;
    damageFormula = action.damage ?? damageFormula;
    isRangedAttack = isRangedAtDistance(action, distance);
    chosenAttackName = action.name;
  }

  let catalog = null;
  try {
    catalog = getCatalogMonsterByKey(attacker.catalogKey);
  } catch {
    catalog = null;
  }

  const packTactics =
    hasCatalogTrait(catalog?.traits, CATALOG_TRAIT.packTactics) &&
    hasPackTacticsAdvantage({
      attackerId: attackerParticipant.id,
      attackerSide: combatSideOf(attackerParticipant),
      targetId: targetParticipant.id,
      targetPositionFeet: targetParticipant.positionFeet,
      fighters: await loadPackFighters(allParticipants),
    });

  const freshAttacker = await monsterInstanceRepository.getById(attacker.id);
  const attackerHidden = freshAttacker ? hasFlag(freshAttacker.conditions, CombatFlag.hidden) : false;
  const rollMode = combineRollModes(packTactics || attackerHidden, false);
  const advantageReasons: string[] = [];
  if (packTactics) advantageReasons.push('Тактика стаи');
  if (attackerHidden) advantageReasons.push('скрыт');

  const attackRoll = await rollAttackD20({
    campaignId,
    note: `${isOpportunityAttack ? 'Провокационная атака' : 'Атака'} монстра ${attacker.name} по ${target.name}${chosenAttackName ? ` (${chosenAttackName})` : ''}`,
    mode: rollMode,
  });

  if (attackerHidden && freshAttacker) {
    await monsterInstanceRepository.update(attacker.id, {
      conditions: withoutFlag(freshAttacker.conditions, CombatFlag.hidden),
    });
  }

  const attackTotal = attackRoll.value + attackBonus;
  const critResult = resolveCritical({
    attackRoll: attackRoll.value,
    attackTotal,
    targetAc: target.ac,
    targetIsUnconscious: target.isUnconscious,
    isRangedAttack,
    distance,
  });

  const base: IStrikeResult = {
    hit: critResult.hit,
    isCritical: critResult.isCritical,
    isNatural20: critResult.isNatural20,
    isNatural1: critResult.isNatural1,
    attackRoll: attackRoll.value,
    attackRolls: attackRoll.rolls,
    rollMode,
    advantageReasons,
    packTactics,
    revealedFromHide: attackerHidden,
    attackBonus,
    attackTotal,
    targetAc: target.ac,
    attackerName: attacker.name,
    targetName: target.name,
    attackName: chosenAttackName,
    isOpportunityAttack,
  };

  if (!critResult.hit) return base;

  const { dieCount, die, bonus } = parseDamageFormula(damageFormula);
  const damageRolls: number[] = [];
  let damageTotal = 0;

  if (die === null) damageTotal = bonus;
  else {
    const effectiveDieCount = critResult.isCritical ? dieCount * 2 : dieCount;
    for (let i = 0; i < effectiveDieCount; i += 1) {
      const roll = await rollDice({
        campaignId,
        die,
        note: `Урон монстра ${attacker.name} по ${target.name} (кубик ${i + 1})${critResult.isCritical ? ' [КРИТ]' : ''}`,
        npcId: null,
        playerId: null,
      });
      damageRolls.push(roll.value);
    }
    damageTotal = damageRolls.reduce((sum, val) => sum + val, 0) + bonus;
  }

  const applied = await applyStrikeDamage({
    targetParticipant,
    target,
    damageTotal,
    damageType: resolveStrikeDamageType(action?.damageType),
    isCritical: critResult.isCritical,
  });

  await checkEncounterEnd({ encounterId });

  return {
    ...base,
    damageFormula,
    damageRolls,
    damageBonus: bonus,
    damageRaw: applied.damageRaw,
    damageTotal: applied.damageTotal,
    damageType: applied.damageType,
    damageModifiers: applied.damageModifiers,
    targetPreviousHp: target.hp,
    targetNewHp: applied.newHp,
    targetMaxHp: target.maxHp,
    targetIsOut: applied.targetIsOut,
    deathSaveFailuresAdded: applied.deathSaveFailuresAdded,
  };
};
