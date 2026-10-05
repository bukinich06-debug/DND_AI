import type { IMonsterAction, TMonsterAttackType } from '../types';

export const getAttackType = (action: IMonsterAction): TMonsterAttackType => action.attackType ?? 'melee';

export const isActionInRange = (action: IMonsterAction, distance: number): boolean => {
  const type = getAttackType(action);
  if (type === 'melee') return distance <= 5;
  if (type === 'thrown') {
    if (distance <= 5) return true;
    return action.rangeNormal != null && distance <= action.rangeNormal;
  }
  if (action.rangeNormal == null) return false;
  return distance <= action.rangeNormal;
};

export const isRangedAtDistance = (action: IMonsterAction, distance: number): boolean => {
  const type = getAttackType(action);
  if (type === 'ranged') return true;
  if (type === 'thrown') return distance > 5;
  return false;
};
