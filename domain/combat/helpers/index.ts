export { CombatFlag, isIncapacitated, hasFlag, withFlag, withoutFlag } from './combatFlags';
export type { CombatFlag as TCombatFlag } from './combatFlags';
export { combineRollModes, pickD20 } from './pickD20';
export type { TRollMode } from './pickD20';
export { combatSideOf, isAllyOf } from './sides';
export type { TCombatSide } from './sides';
export { hasPackTacticsAdvantage } from './packTactics';
export type { IPackFighter } from './packTactics';
export { approachOnLine } from './approachOnLine';
export { MELEE_REACH_FEET, isInMeleeReach, leavesReachOnPath, opportunityAttackerIds } from './opportunityAttack';
export {
  UNARMED_DAMAGE_TYPE,
  DEFAULT_DAMAGE_TYPE,
  DAMAGE_TYPE_LABEL,
  DAMAGE_MODIFIER_LABEL,
  parseDamageType,
  damageTypeLabel,
  resolveStrikeDamageType,
  sameDamageType,
  formatDamageTypeNote,
} from './damageType';
export type { TDamageType, TDamageModifierKind } from './damageType';
export { applyDamageModifiers } from './applyDamageModifiers';
export type { IApplyDamageModifiersResult } from './applyDamageModifiers';
