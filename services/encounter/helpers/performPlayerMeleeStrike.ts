import { itemRepository } from '@/data/item';
import { monsterInstanceRepository } from '@/data/monster';
import { CombatFlag, combineRollModes, hasFlag, resolveStrikeDamageType, UNARMED_DAMAGE_TYPE } from '@/domain/combat';
import type { IEncounterParticipant } from '@/domain/encounter';
import { isFinesseWeapon, isRangedWeapon } from '@/domain/item/validation/validateProperties';
import { abilityMod, type IPlayer } from '@/domain/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import { checkEncounterEnd } from '@/services/encounter/checkEncounterEnd';
import { applyStrikeDamage, loadCombatTarget } from '@/services/encounter/helpers/applyStrikeDamage';
import { parseDamageFormula } from '@/services/encounter/helpers/parseDamageFormula';
import { resolveCritical } from '@/services/encounter/helpers/resolveCritical';
import { rollAttackD20 } from '@/services/encounter/helpers/rollAttackD20';
import type { IStrikeResult } from '@/services/encounter/helpers/strikeTypes';

interface IPerformPlayerMeleeStrikeParams {
  campaignId: string;
  encounterId: string;
  attacker: IPlayer;
  attackerParticipant: IEncounterParticipant;
  targetParticipant: IEncounterParticipant;
  isOpportunityAttack?: boolean;
}

const pickMeleeWeapon = async (playerId: string) => {
  const items = await itemRepository.listByPlayerId(playerId);
  const equipped = items.filter(
    (item) => item.equipSlot === 'mainHand' || item.equipSlot === 'offHand' || item.equipSlot === 'ranged'
  );
  const melee = equipped.filter((item) => item.equipSlot !== 'ranged' && !isRangedWeapon(item.properties));
  return (
    melee.find((item) => item.equipSlot === 'mainHand') ?? melee.find((item) => item.equipSlot === 'offHand') ?? null
  );
};

export const performPlayerMeleeStrike = async ({
  campaignId,
  encounterId,
  attacker,
  attackerParticipant,
  targetParticipant,
  isOpportunityAttack = false,
}: IPerformPlayerMeleeStrikeParams): Promise<IStrikeResult> => {
  const target = await loadCombatTarget(targetParticipant);
  const distance = Math.abs(attackerParticipant.positionFeet - targetParticipant.positionFeet);
  const weapon = await pickMeleeWeapon(attacker.id);

  let weaponName = 'Безоружная атака';
  let damageFormula = `1${abilityMod(attacker.str) >= 0 ? '+' : ''}${abilityMod(attacker.str)}`;
  let attackBonus = abilityMod(attacker.str) + attacker.proficiencyBonus;
  let damageType = UNARMED_DAMAGE_TYPE;

  if (weapon) {
    weaponName = weapon.name;
    const props = weapon.properties ?? [];
    const damageProp = props.find((p) => p.type === 'damage');
    const isFinesse = isFinesseWeapon(props);
    const ability = isFinesse ? Math.max(abilityMod(attacker.str), abilityMod(attacker.dex)) : abilityMod(attacker.str);
    attackBonus = ability + attacker.proficiencyBonus;
    if (damageProp && damageProp.type === 'damage') {
      damageFormula = `${damageProp.dice}${ability >= 0 ? '+' : ''}${ability}`;
      damageType = resolveStrikeDamageType(damageProp.damageType);
    }
  }

  const targetMonster = targetParticipant.monsterInstanceId
    ? await monsterInstanceRepository.getById(targetParticipant.monsterInstanceId)
    : null;
  const targetHidden = targetMonster ? hasFlag(targetMonster.conditions, CombatFlag.hidden) : false;
  const rollMode = combineRollModes(false, targetHidden);

  const attackRoll = await rollAttackD20({
    campaignId,
    note: `${isOpportunityAttack ? 'Провокационная атака' : 'Атака'} игрока ${attacker.name} по ${target.name} (${weaponName})`,
    mode: rollMode,
    playerId: attacker.id,
  });

  const attackTotal = attackRoll.value + attackBonus;
  const critResult = resolveCritical({
    attackRoll: attackRoll.value,
    attackTotal,
    targetAc: target.ac,
    targetIsUnconscious: target.isUnconscious,
    isRangedAttack: false,
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
    advantageReasons: targetHidden ? ['цель скрыта'] : [],
    packTactics: false,
    revealedFromHide: false,
    attackBonus,
    attackTotal,
    targetAc: target.ac,
    attackerName: attacker.name,
    targetName: target.name,
    attackName: null,
    weaponName,
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
        note: `Урон игрока ${attacker.name} по ${target.name} (кубик ${i + 1})${critResult.isCritical ? ' [КРИТ]' : ''}`,
        npcId: null,
        playerId: attacker.id,
      });
      damageRolls.push(roll.value);
    }
    damageTotal = damageRolls.reduce((sum, val) => sum + val, 0) + bonus;
  }

  const applied = await applyStrikeDamage({
    targetParticipant,
    target,
    damageTotal,
    damageType,
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
