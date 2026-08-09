'use server';

import { npcKnowledgeRepository } from '@/data/npc';

export const deleteNpcKnowledge = async (id: string) => {
  const existing = await npcKnowledgeRepository.getById(id);
  if (!existing) throw new Error('Знание NPC не найдено.');
  await npcKnowledgeRepository.delete(id);
};
