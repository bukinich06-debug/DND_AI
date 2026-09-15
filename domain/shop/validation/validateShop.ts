import type { IBuyFromShopInput } from '../types';

export const validateBuyFromShop = (input: IBuyFromShopInput) => {
  if (!input.playerId?.trim()) throw new Error('playerId обязателен.');
  if (!input.npcId?.trim()) throw new Error('npcId обязателен.');
  if (!input.itemId?.trim()) throw new Error('itemId обязателен.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1)
    throw new Error('quantity должно быть положительным целым числом.');
};
