'use server';

import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { KnowledgeReveal } from '@/domain/shared';
import type { INpcKnowledge } from '@/domain/npc';

type AgentKnowledge = Omit<INpcKnowledge, 'content'> & { content: string | null };

const stripForCheck = (item: INpcKnowledge): AgentKnowledge => ({
  ...item,
  content: null,
});

const toAgentView = (item: INpcKnowledge): AgentKnowledge => {
  if (item.reveal === KnowledgeReveal.open) return item;
  if (item.reveal === KnowledgeReveal.check) return stripForCheck(item);
  throw new Error('Знание недоступно.');
};

export const listNpcKnowledgeForAgent = async (
  npcId: string,
  options?: { reveal?: KnowledgeReveal; campaignId?: string }
) => {
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (options?.campaignId && npc.campaignId !== options.campaignId)
    throw new Error('NPC не принадлежит этой кампании.');

  const reveal = options?.reveal ?? KnowledgeReveal.open;
  if (reveal === KnowledgeReveal.hidden) throw new Error('Скрытые знания недоступны.');

  const items = await npcKnowledgeRepository.listByNpcId(npcId);
  return items.filter((item) => item.reveal === reveal).map(toAgentView);
};
