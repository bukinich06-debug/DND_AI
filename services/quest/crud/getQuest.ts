'use server';

import { questRepository } from '@/data/quest';

export const getQuest = async (id: string) => {
  const quest = await questRepository.getById(id);
  if (!quest) throw new Error('Квест не найден.');
  return quest;
};
