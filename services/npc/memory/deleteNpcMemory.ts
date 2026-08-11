'use server';

import { npcMemoryRepository } from '@/data/npc';

export const deleteNpcMemory = async (id: string) => {
  const existing = await npcMemoryRepository.getById(id);
  if (!existing) throw new Error('Воспоминание NPC не найдено.');
  await npcMemoryRepository.delete(id);
};
