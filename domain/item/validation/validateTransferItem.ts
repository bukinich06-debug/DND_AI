import type { IDropItem, ITakeItem } from '../types';

export const validateTakeItem = (input: ITakeItem) => {
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.itemId.trim()) throw new Error('Предмет обязателен.');
};

export const validateDropItem = (input: IDropItem) => {
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.itemId.trim()) throw new Error('Предмет обязателен.');
};
