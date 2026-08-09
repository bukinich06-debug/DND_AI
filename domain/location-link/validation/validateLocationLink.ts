import type { ICreateLocationLink, IUpdateLocationLink } from '../types';

const assertDays = (days: number) => {
  if (!Number.isInteger(days) || days < 1) throw new Error('Длительность пути должна быть целым числом не меньше 1.');
};

export const validateCreateLocationLink = (input: ICreateLocationLink) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.fromId.trim()) throw new Error('Начальная локация обязательна.');
  if (!input.toId.trim()) throw new Error('Конечная локация обязательна.');
  if (input.fromId === input.toId) throw new Error('Начало и конец пути не могут совпадать.');
  assertDays(input.days);
};

export const validateUpdateLocationLink = (input: IUpdateLocationLink) => {
  if (input.fromId !== undefined && !input.fromId.trim()) throw new Error('Начальная локация обязательна.');
  if (input.toId !== undefined && !input.toId.trim()) throw new Error('Конечная локация обязательна.');
  if (input.fromId !== undefined && input.toId !== undefined && input.fromId === input.toId)
    throw new Error('Начало и конец пути не могут совпадать.');
  if (input.days !== undefined) assertDays(input.days);
};
