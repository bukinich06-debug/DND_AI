'use server';

import type { INpcAtLocation } from '@/domain/npc';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { listNpcsAtLocation } from './listNpcsAtLocation';

export const listNpcsAtPlayerLocation = async (playerId: string): Promise<INpcAtLocation[]> => {
  if (!playerId.trim()) throw new Error('Игрок обязателен.');

  const player = await getPlayer(playerId.trim());
  if (!player.locationId) return [];

  return listNpcsAtLocation(player.locationId);
};
