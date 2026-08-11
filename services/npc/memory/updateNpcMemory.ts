'use server';

import { npcMemoryRepository, npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { validateUpdateNpcMemory, type IUpdateNpcMemory } from '@/domain/npc';

export const updateNpcMemory = async (id: string, input: IUpdateNpcMemory) => {
  const existing = await npcMemoryRepository.getById(id);
  if (!existing) throw new Error('Воспоминание NPC не найдено.');
  validateUpdateNpcMemory(input);

  if (input.playerId) {
    const npc = await npcRepository.getById(existing.npcId);
    if (!npc) throw new Error('NPC не найден.');
    const player = await playerRepository.getById(input.playerId);
    if (!player) throw new Error('Игрок не найден.');
    if (player.campaignId !== npc.campaignId) throw new Error('Игрок из другой кампании.');
  }

  return npcMemoryRepository.update(id, input);
};
