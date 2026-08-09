'use server';

import { npcRepository } from '@/data/npc';

export const getNpc = async (id: string) => {
  const npc = await npcRepository.getById(id);
  if (!npc) throw new Error('NPC не найден.');
  return npc;
};
