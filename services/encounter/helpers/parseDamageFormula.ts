import { DiceKind } from '@/domain/shared';

export const parseDamageFormula = (formula: string): { dieCount: number; die: DiceKind | null; bonus: number } => {
  const fixedOnlyMatch = formula.match(/^(\d+)$/);
  if (fixedOnlyMatch) return { dieCount: 0, die: null, bonus: parseInt(fixedOnlyMatch[1], 10) };

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
