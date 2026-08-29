'use server';

import { itemRepository } from '@/data/item';
import { playerRepository } from '@/data/player';

export const listItemsByPlayer = async (playerId: string) => {
  const player = await playerRepository.getById(playerId);
  if (!player) throw new Error('Игрок не найден.');
  return itemRepository.listByPlayerId(playerId);
};
