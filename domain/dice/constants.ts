import type { DiceKind } from '@/domain/shared';

export const DIE_SIDES: Record<DiceKind, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};
