'use server';

import { npcLocationRepository } from '@/data/npc';

export const listNpcLocations = async (npcId: string) => npcLocationRepository.listByNpcId(npcId);
