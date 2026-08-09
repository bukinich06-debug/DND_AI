import { Condition, MAX_EXHAUSTION_LEVEL } from '../constants';
import type { IAddPlayerCondition, IGetPlayerConditions, IRemovePlayerCondition } from '../types';

const conditionKeys = new Set<string>(Object.values(Condition));

export const validateConditionKeys = (conditions: string[]) => {
  for (const key of conditions) {
    if (!conditionKeys.has(key)) throw new Error(`Неизвестное состояние: ${key}.`);
  }
};

export const validateExhaustionLevel = (exhaustionLevel: number) => {
  if (!Number.isInteger(exhaustionLevel) || exhaustionLevel < 0 || exhaustionLevel > MAX_EXHAUSTION_LEVEL)
    throw new Error(`Уровень истощения должен быть от 0 до ${MAX_EXHAUSTION_LEVEL}.`);
};

export const validateConditionState = (conditions: string[], exhaustionLevel: number) => {
  validateExhaustionLevel(exhaustionLevel);
  validateConditionKeys(conditions);

  const hasExhaustion = conditions.includes(Condition.exhaustion);
  if (exhaustionLevel > 0 && !hasExhaustion)
    throw new Error('При уровне истощения > 0 в списке должно быть состояние exhaustion.');
  if (exhaustionLevel === 0 && hasExhaustion) throw new Error('Состояние exhaustion требует уровень истощения > 0.');
};

export const validateGetPlayerConditions = (input: IGetPlayerConditions) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
};

export const validateAddPlayerCondition = (input: IAddPlayerCondition) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.condition.trim()) throw new Error('Состояние обязательно.');
  if (input.exhaustionLevel !== undefined && input.exhaustionLevel !== null) {
    if (
      !Number.isInteger(input.exhaustionLevel) ||
      input.exhaustionLevel < 0 ||
      input.exhaustionLevel > MAX_EXHAUSTION_LEVEL
    )
      throw new Error(`Уровень истощения должен быть от 0 до ${MAX_EXHAUSTION_LEVEL}.`);
  }
};

export const validateRemovePlayerCondition = (input: IRemovePlayerCondition) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.condition.trim()) throw new Error('Состояние обязательно.');
  if (input.exhaustionLevel !== undefined && input.exhaustionLevel !== null) {
    if (
      !Number.isInteger(input.exhaustionLevel) ||
      input.exhaustionLevel < 0 ||
      input.exhaustionLevel > MAX_EXHAUSTION_LEVEL
    )
      throw new Error(`Уровень истощения должен быть от 0 до ${MAX_EXHAUSTION_LEVEL}.`);
  }
};
