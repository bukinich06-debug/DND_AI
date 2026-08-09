import type { ISearchPlayerItems } from '../types';

export const validateSearchPlayerItems = (input: ISearchPlayerItems) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
};
