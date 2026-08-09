'use server';

import { playerRepository } from '@/data/player';

export const getPlayer = async (id: string) => {
  const player = await playerRepository.getById(id);
  if (!player) throw new Error('Персонаж не найден.');
  return player;
};
