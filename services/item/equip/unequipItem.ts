'use server';

import { itemRepository } from '@/data/item';
import { validateUnequipItem, type IUnequipItem } from '@/domain/item';

export const unequipItem = async (input: IUnequipItem) => {
  validateUnequipItem(input);
  const item = await itemRepository.getById(input.itemId.trim());
  if (!item) throw new Error('Предмет не найден.');
  if (!item.playerId) throw new Error('Снять можно только предмет игрока.');
  if (item.equipSlot == null) return item;
  return itemRepository.update(item.id, { equipSlot: null });
};
