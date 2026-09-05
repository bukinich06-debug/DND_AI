import type { ISearchLocationItems } from '../types';

export const validateSearchLocationItems = (input: ISearchLocationItems) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.locationId.trim()) throw new Error('Локация обязательна.');
};
