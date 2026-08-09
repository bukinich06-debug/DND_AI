'use server';

import { playerRepository } from '@/data/player';

export const deletePlayer = async (id: string) => {
  const existing = await playerRepository.getById(id);
  if (!existing) throw new Error('Персонаж не найден.');
  await playerRepository.delete(id);
};
