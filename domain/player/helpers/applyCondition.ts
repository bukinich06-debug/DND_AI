import { Condition, MAX_EXHAUSTION_LEVEL } from '../constants';

export interface IConditionState {
  conditions: string[];
  exhaustionLevel: number;
}

interface IAddConditionInput {
  state: IConditionState;
  condition: Condition;
  /** Для exhaustion: установить уровень; иначе +1 */
  exhaustionLevel?: number;
}

interface IRemoveConditionInput {
  state: IConditionState;
  condition: Condition;
  /** Для exhaustion: установить уровень; иначе −1 */
  exhaustionLevel?: number;
}

const without = (list: string[], key: string) => list.filter((item) => item !== key);

const withKey = (list: string[], key: string) => (list.includes(key) ? list : [...list, key]);

const syncExhaustion = (conditions: string[], level: number): IConditionState => {
  if (level <= 0) return { conditions: without(conditions, Condition.exhaustion), exhaustionLevel: 0 };
  return {
    conditions: withKey(without(conditions, Condition.exhaustion), Condition.exhaustion),
    exhaustionLevel: Math.min(level, MAX_EXHAUSTION_LEVEL),
  };
};

export const addCondition = ({ state, condition, exhaustionLevel }: IAddConditionInput): IConditionState => {
  if (condition === Condition.exhaustion) {
    const nextLevel =
      exhaustionLevel !== undefined ? exhaustionLevel : Math.min(state.exhaustionLevel + 1, MAX_EXHAUSTION_LEVEL);
    return syncExhaustion(state.conditions, nextLevel);
  }

  return {
    conditions: withKey(state.conditions, condition),
    exhaustionLevel: state.exhaustionLevel,
  };
};

export const removeCondition = ({ state, condition, exhaustionLevel }: IRemoveConditionInput): IConditionState => {
  if (condition === Condition.exhaustion) {
    const nextLevel = exhaustionLevel !== undefined ? exhaustionLevel : Math.max(state.exhaustionLevel - 1, 0);
    return syncExhaustion(state.conditions, nextLevel);
  }

  return {
    conditions: without(state.conditions, condition),
    exhaustionLevel: state.exhaustionLevel,
  };
};
