import type { IApplyPlayerHp, ILongRest, IShortRest } from '../types';

export const validateApplyPlayerHp = (input: IApplyPlayerHp) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!Number.isInteger(input.delta)) throw new Error('Изменение хитов должно быть целым числом.');
};

export const validateShortRest = (input: IShortRest) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!Number.isInteger(input.hitDice) || input.hitDice < 1) throw new Error('Нужно потратить хотя бы одну кость хитов.');
};

export const validateLongRest = (input: ILongRest) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
};
