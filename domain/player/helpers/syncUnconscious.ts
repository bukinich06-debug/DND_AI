import { addCondition, removeCondition, type IConditionState } from './applyCondition';
import { Condition } from '../constants';

export const syncUnconscious = (hpCurrent: number, state: IConditionState): IConditionState => {
  if (hpCurrent <= 0) return addCondition({ state, condition: Condition.unconscious });
  return removeCondition({ state, condition: Condition.unconscious });
};
