'use server';

import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { questRepository } from '@/data/quest';
import { validateCreateNpcKnowledge, type ICreateNpcKnowledge } from '@/domain/npc';

export const createNpcKnowledge = async (input: ICreateNpcKnowledge) => {
  validateCreateNpcKnowledge(input);
  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');

  if (input.questId) {
    const quest = await questRepository.getById(input.questId);
    if (!quest) throw new Error('Квест не найден.');
    if (quest.campaignId !== npc.campaignId) throw new Error('Квест из другой кампании.');
  }

  return npcKnowledgeRepository.create(input);
};
