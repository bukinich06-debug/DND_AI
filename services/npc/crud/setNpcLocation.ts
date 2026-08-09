'use server';

import { locationRepository } from '@/data/location';
import { npcLocationRepository, npcRepository } from '@/data/npc';
import { validateSetNpcLocation, type ISetNpcLocation } from '@/domain/npc';

export const setNpcLocation = async (input: ISetNpcLocation) => {
  validateSetNpcLocation(input);
  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');
  const location = await locationRepository.getById(input.locationId);
  if (!location) throw new Error('Локация не найдена.');
  if (location.campaignId !== npc.campaignId) throw new Error('NPC и локация из разных кампаний.');
  return npcLocationRepository.set(input);
};
