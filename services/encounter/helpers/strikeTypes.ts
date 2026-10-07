import type { TDamageModifierKind, TRollMode } from '@/domain/combat';

export interface IStrikeResult {
  hit: boolean;
  isCritical: boolean;
  isNatural20: boolean;
  isNatural1: boolean;
  attackRoll: number;
  attackRolls: number[];
  rollMode: TRollMode;
  advantageReasons: string[];
  packTactics: boolean;
  revealedFromHide: boolean;
  attackBonus: number;
  attackTotal: number;
  targetAc: number;
  damageFormula?: string;
  damageRolls?: number[];
  damageBonus?: number;
  damageRaw?: number;
  damageTotal?: number;
  damageType?: string | null;
  damageModifiers?: TDamageModifierKind[];
  attackerName: string;
  targetName: string;
  targetPreviousHp?: number;
  targetNewHp?: number;
  targetMaxHp?: number;
  targetIsOut?: boolean;
  deathSaveFailuresAdded?: number;
  attackName: string | null;
  weaponName?: string;
  isOpportunityAttack: boolean;
}
