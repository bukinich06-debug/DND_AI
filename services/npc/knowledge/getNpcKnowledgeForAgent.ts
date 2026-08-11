'use server';

import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { KnowledgeReveal } from '@/domain/shared';
import type { INpcKnowledge } from '@/domain/npc';

type AgentKnowledge = Omit<INpcKnowledge, 'content'> & { content: string | null };

export const getNpcKnowledgeForAgent = async (knowledgeId: string, campaignId?: string) => {
  const knowledge = await npcKnowledgeRepository.getById(knowledgeId);
  if (!knowledge) throw new Error('Знание NPC не найдено.');

  const npc = await npcRepository.getById(knowledge.npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (campaignId && npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  if (knowledge.reveal === KnowledgeReveal.hidden) throw new Error('Знание недоступно.');

  if (knowledge.reveal === KnowledgeReveal.check) {
    const result: AgentKnowledge = { ...knowledge, content: null };
    return result;
  }

  return knowledge as AgentKnowledge;
};
