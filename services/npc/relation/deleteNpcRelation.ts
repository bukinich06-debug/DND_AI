'use server';

import { npcRelationRepository } from '@/data/npc';

export const deleteNpcRelation = async (npcId: string, playerId: string) => {
  const existing = await npcRelationRepository.get(npcId, playerId);
  if (!existing) throw new Error('Отношение NPC не найдено.');
  await npcRelationRepository.delete(npcId, playerId);
};
