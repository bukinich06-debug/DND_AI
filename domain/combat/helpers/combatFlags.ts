export const CombatFlag = {
  hidden: 'hidden',
  disengaged: 'disengaged',
} as const;

export type CombatFlag = (typeof CombatFlag)[keyof typeof CombatFlag];

const INCAPACITATED = new Set(['unconscious', 'paralyzed', 'stunned', 'incapacitated', 'petrified']);

export const isIncapacitated = (conditions: string[]): boolean =>
  conditions.some((c) => INCAPACITATED.has(c.toLowerCase()));

export const hasFlag = (conditions: string[], flag: CombatFlag): boolean =>
  conditions.some((c) => c.toLowerCase() === flag);

export const withFlag = (conditions: string[], flag: CombatFlag): string[] =>
  hasFlag(conditions, flag) ? conditions : [...conditions, flag];

export const withoutFlag = (conditions: string[], flag: CombatFlag): string[] =>
  conditions.filter((c) => c.toLowerCase() !== flag);
