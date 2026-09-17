'use server';

import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { KnowledgeReveal } from '@/domain/shared';
import { toAgentKnowledge, type IPassedCheck } from './helpers/toAgentKnowledge';

export const getNpcKnowledgeForAgent = async (knowledgeId: string, campaignId?: string, passedCheck?: IPassedCheck) => {
  const knowledge = await npcKnowledgeRepository.getById(knowledgeId);
  if (!knowledge) throw new Error('Знание NPC не найдено.');

  const npc = await npcRepository.getById(knowledge.npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (campaignId && npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  if (knowledge.reveal === KnowledgeReveal.hidden) throw new Error('Знание недоступно.');

  return toAgentKnowledge(knowledge, passedCheck);
};
