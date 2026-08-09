'use server';

import { itemRepository } from '@/data/item';

export const deleteItem = async (id: string) => {
  const existing = await itemRepository.getById(id);
  if (!existing) throw new Error('Предмет не найден.');
  await itemRepository.delete(id);
};
