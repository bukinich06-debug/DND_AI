'use server';

import { itemRepository } from '@/data/item';

export const getItem = async (id: string) => {
  const item = await itemRepository.getById(id);
  if (!item) throw new Error('Предмет не найден.');
  return item;
};
