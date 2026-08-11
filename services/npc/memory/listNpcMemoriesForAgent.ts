'use server';

import { npcRepository } from '@/data/npc';
import type { IListNpcMemoriesFilter } from '@/domain/npc';
import { listNpcMemories } from '@/services/npc/memory/listNpcMemories';

export const listNpcMemoriesForAgent = async (npcId: string, campaignId: string, filter?: IListNpcMemoriesFilter) => {
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');
  return listNpcMemories(npcId, filter);
};
