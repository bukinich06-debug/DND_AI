'use server';

import { npcRepository } from '@/data/npc';
import type { ICreateNpcMemory } from '@/domain/npc';
import { createNpcMemory } from '@/services/npc/memory/createNpcMemory';

export const createNpcMemoryForAgent = async (input: ICreateNpcMemory, campaignId: string) => {
  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  if (input.aboutNpcId) {
    if (input.aboutNpcId === input.npcId) throw new Error('Субъект воспоминания не может быть самим speaker.');
    const about = await npcRepository.getById(input.aboutNpcId);
    if (!about) throw new Error('Субъект воспоминания не найден.');
    if (about.campaignId !== campaignId) throw new Error('Субъект воспоминания из другой кампании.');
  }

  return createNpcMemory(input);
};
