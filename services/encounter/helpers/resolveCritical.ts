interface IResolveCriticalInput {
  attackRoll: number;
  attackTotal: number;
  targetAc: number;
  targetIsUnconscious: boolean;
  isRangedAttack: boolean;
  distance: number;
}

interface IResolveCriticalResult {
  hit: boolean;
  isCritical: boolean;
  isNatural20: boolean;
  isNatural1: boolean;
  reason?: 'natural_20' | 'natural_1' | 'unconscious_melee_autocrit' | 'normal';
}

export const resolveCritical = (input: IResolveCriticalInput): IResolveCriticalResult => {
  const isNatural20 = input.attackRoll === 20;
  const isNatural1 = input.attackRoll === 1;

  if (isNatural1) {
    return {
      hit: false,
      isCritical: false,
      isNatural20: false,
      isNatural1: true,
      reason: 'natural_1',
    };
  }

  if (isNatural20) {
    return {
      hit: true,
      isCritical: true,
      isNatural20: true,
      isNatural1: false,
      reason: 'natural_20',
    };
  }

  if (input.targetIsUnconscious && !input.isRangedAttack && input.distance <= 5) {
    return {
      hit: true,
      isCritical: true,
      isNatural20: false,
      isNatural1: false,
      reason: 'unconscious_melee_autocrit',
    };
  }

  const normalHit = input.attackTotal >= input.targetAc;
  return {
    hit: normalHit,
    isCritical: false,
    isNatural20: false,
    isNatural1: false,
    reason: 'normal',
  };
};
