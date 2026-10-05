import type { IStrikeResult } from './strikeTypes';

export const formatStrikeMessage = (res: IStrikeResult): string => {
  const nameText = res.attackName ? ` (${res.attackName})` : res.weaponName ? ` (${res.weaponName})` : '';
  const oaPrefix = res.isOpportunityAttack ? `провокационная атака ${res.attackerName}: ` : '';

  if (res.hit && res.damageTotal !== undefined) {
    const critText = res.isCritical ? (res.isNatural20 ? ' [КРИТ nat20]' : ' [КРИТ автокрит]') : '';
    const rollModeText =
      res.rollMode === 'advantage' ? ' преимущество' : res.rollMode === 'disadvantage' ? ' помеха' : '';
    const rollsText =
      res.attackRolls && res.attackRolls.length === 2 ? ` ${res.attackRolls[0]}/${res.attackRolls[1]}` : '';
    const traitText =
      res.advantageReasons && res.advantageReasons.length > 0 ? ` [${res.advantageReasons.join(', ')}]` : '';
    const attackDetails =
      res.attackRoll !== undefined && res.attackBonus !== undefined && res.targetAc !== undefined
        ? `d20${rollsText}${rollModeText} ${res.attackRoll}+${res.attackBonus}=${res.attackTotal} vs AC ${res.targetAc}${traitText}, `
        : '';
    const damageDetails =
      res.damageRolls && res.damageBonus !== undefined
        ? `${res.damageRolls.join('+')}${res.damageBonus >= 0 ? '+' : ''}${res.damageBonus} → ${res.damageTotal}`
        : `${res.damageTotal}`;
    const hpDetails =
      res.targetPreviousHp !== undefined && res.targetNewHp !== undefined
        ? ` (HP ${res.targetPreviousHp}→${res.targetNewHp})`
        : '';
    const deathSaveDetails =
      res.deathSaveFailuresAdded && res.deathSaveFailuresAdded > 0
        ? ` [провалы спасброска +${res.deathSaveFailuresAdded}]`
        : '';
    return `${oaPrefix}Попадание по ${res.targetName}${nameText}${critText}: ${attackDetails}урон ${damageDetails}${hpDetails}${deathSaveDetails}`;
  }

  if (res.attackRoll !== undefined) {
    const nat1Text = res.isNatural1 ? ' [nat1]' : '';
    const attackDetails =
      res.attackBonus !== undefined && res.targetAc !== undefined
        ? ` (d20 ${res.attackRoll}+${res.attackBonus}=${res.attackTotal} vs AC ${res.targetAc})`
        : '';
    return `${oaPrefix}Атака по ${res.targetName}${nameText} промахнулась${nat1Text}${attackDetails}`;
  }

  return `${oaPrefix}атака не состоялась`;
};
