'use server';

import { npcRelationRepository } from '@/data/npc';

export const getNpcRelation = async (npcId: string, playerId: string) => {
  const relation = await npcRelationRepository.get(npcId, playerId);
  if (!relation) throw new Error('Отношение NPC не найдено.');
  return relation;
};
