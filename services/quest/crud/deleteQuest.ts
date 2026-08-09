'use server';

import { questRepository } from '@/data/quest';

export const deleteQuest = async (id: string) => {
  const existing = await questRepository.getById(id);
  if (!existing) throw new Error('Квест не найден.');
  await questRepository.delete(id);
};
