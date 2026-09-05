'use server';

import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { KnowledgeReveal } from '@/domain/shared';
import { toAgentKnowledge, type IPassedCheck } from './helpers/toAgentKnowledge';

export const listNpcKnowledgeForAgent = async (
  npcId: string,
  options?: { reveal?: KnowledgeReveal; campaignId?: string; passedCheck?: IPassedCheck }
) => {
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (options?.campaignId && npc.campaignId !== options.campaignId)
    throw new Error('NPC не принадлежит этой кампании.');

  const reveal = options?.reveal ?? KnowledgeReveal.open;
  if (reveal === KnowledgeReveal.hidden) throw new Error('Скрытые знания недоступны.');

  const items = await npcKnowledgeRepository.listByNpcId(npcId);
  return items.filter((item) => item.reveal === reveal).map((item) => toAgentKnowledge(item, options?.passedCheck));
};
