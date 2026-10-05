export type TRollMode = 'normal' | 'advantage' | 'disadvantage';

export const combineRollModes = (advantage: boolean, disadvantage: boolean): TRollMode => {
  if (advantage && disadvantage) return 'normal';
  if (advantage) return 'advantage';
  if (disadvantage) return 'disadvantage';
  return 'normal';
};

export const pickD20 = (a: number, b: number, mode: TRollMode): { value: number; other: number } => {
  if (mode === 'advantage') return a >= b ? { value: a, other: b } : { value: b, other: a };
  if (mode === 'disadvantage') return a <= b ? { value: a, other: b } : { value: b, other: a };
  return { value: a, other: b };
};
