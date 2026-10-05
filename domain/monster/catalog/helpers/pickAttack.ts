import type { IMonsterAction } from '../types';
import { isActionInRange } from './actionRange';
import { expandMultiattack, isMultiattackAction } from './multiattack';

export const pickDefaultAttack = (actions: IMonsterAction[], distance: number): IMonsterAction | null => {
  const multi = actions.find(isMultiattackAction);
  if (multi) {
    const parts = expandMultiattack(multi, actions);
    if (parts.some((p) => isActionInRange(p, distance))) return multi;
  }

  return actions.find((a) => !isMultiattackAction(a) && isActionInRange(a, distance)) ?? null;
};
