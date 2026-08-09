'use server';

import { npcRepository } from '@/data/npc';

export const deleteNpc = async (id: string) => {
  const existing = await npcRepository.getById(id);
  if (!existing) throw new Error('NPC не найден.');
  await npcRepository.delete(id);
};
