'use server';

import { npcLocationRepository } from '@/data/npc';

export const removeNpcLocation = async (npcId: string, locationId: string) => {
  const links = await npcLocationRepository.listByNpcId(npcId);
  const existing = links.find((link) => link.locationId === locationId);
  if (!existing) throw new Error('Связь NPC с локацией не найдена.');
  await npcLocationRepository.remove(npcId, locationId);
};
