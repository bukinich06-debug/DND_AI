import type { IAdvanceTime, IAdvanceTravel, IGetPlayerLocation, IMovePlayer, IStartTravel } from '../types';

export const validateGetPlayerLocation = (input: IGetPlayerLocation) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
};

export const validateMovePlayer = (input: IMovePlayer) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.locationId.trim()) throw new Error('Локация обязательна.');
};

export const validateStartTravel = (input: IStartTravel) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.destinationId.trim()) throw new Error('Цель путешествия обязательна.');
};

export const validateAdvanceTravel = (input: IAdvanceTravel) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (input.days !== undefined && (!Number.isInteger(input.days) || input.days < 1))
    throw new Error('Число дней должно быть целым числом не меньше 1.');
};

export const validateAdvanceTime = (input: IAdvanceTime) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!Number.isInteger(input.slots) || input.slots < 1)
    throw new Error('Число слотов должно быть целым числом не меньше 1.');
};
