'use server';

import { locationRepository } from '@/data/location';
import { npcLocationRepository, npcRepository } from '@/data/npc';
import type { INpcAtLocation } from '@/domain/npc';

export const listNpcsAtLocation = async (locationId: string): Promise<INpcAtLocation[]> => {
  if (!locationId.trim()) throw new Error('Локация обязательна.');

  const location = await locationRepository.getById(locationId.trim());
  if (!location) throw new Error('Локация не найдена.');

  const links = await npcLocationRepository.listByLocationId(location.id);
  const here: INpcAtLocation[] = [];
  for (const link of links) {
    const npc = await npcRepository.getById(link.npcId);
    if (npc && npc.campaignId === location.campaignId) here.push({ npc, role: link.role, isPrimary: link.isPrimary });
  }
  return here;
};
