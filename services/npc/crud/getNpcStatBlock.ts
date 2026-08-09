'use server';

import { npcStatBlockRepository } from '@/data/npc';

export const getNpcStatBlock = async (npcId: string) => {
  const block = await npcStatBlockRepository.getByNpcId(npcId);
  if (!block) throw new Error('Статблок NPC не найден.');
  return block;
};
