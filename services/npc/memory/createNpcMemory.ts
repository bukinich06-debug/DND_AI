'use server';

import { npcMemoryRepository, npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { validateCreateNpcMemory, type ICreateNpcMemory } from '@/domain/npc';

export const createNpcMemory = async (input: ICreateNpcMemory) => {
  validateCreateNpcMemory(input);

  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');

  if (input.playerId) {
    const player = await playerRepository.getById(input.playerId);
    if (!player) throw new Error('Игрок не найден.');
    if (player.campaignId !== npc.campaignId) throw new Error('Игрок из другой кампании.');
  }

  return npcMemoryRepository.create(input);
};
