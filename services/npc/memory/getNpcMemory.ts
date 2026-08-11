'use server';

import { npcMemoryRepository } from '@/data/npc';

export const getNpcMemory = async (id: string) => {
  const memory = await npcMemoryRepository.getById(id);
  if (!memory) throw new Error('Воспоминание NPC не найдено.');
  return memory;
};
