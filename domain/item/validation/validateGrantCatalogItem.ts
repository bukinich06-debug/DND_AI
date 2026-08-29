import type { IGrantCatalogItem } from '../types';

const KEY_RE = /^[a-z][a-zA-Z0-9]*$/;

export const validateGrantCatalogItem = (input: IGrantCatalogItem) => {
  if (!input.playerId?.trim()) throw new Error('Игрок обязателен.');
  if (typeof input.key !== 'string' || !KEY_RE.test(input.key.trim()))
    throw new Error('key — латиница, с буквы, без пробелов и дефисов (например dagger).');
  if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity < 1))
    throw new Error('Количество должно быть не меньше 1.');
};
