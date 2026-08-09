'use server';

import { npcStatBlockRepository } from '@/data/npc';

export const deleteNpcStatBlock = async (npcId: string) => {
  const existing = await npcStatBlockRepository.getByNpcId(npcId);
  if (!existing) throw new Error('Статблок NPC не найден.');
  await npcStatBlockRepository.deleteByNpcId(npcId);
};
