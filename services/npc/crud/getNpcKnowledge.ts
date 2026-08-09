'use server';

import { npcKnowledgeRepository } from '@/data/npc';

export const getNpcKnowledge = async (id: string) => {
  const knowledge = await npcKnowledgeRepository.getById(id);
  if (!knowledge) throw new Error('Знание NPC не найдено.');
  return knowledge;
};
