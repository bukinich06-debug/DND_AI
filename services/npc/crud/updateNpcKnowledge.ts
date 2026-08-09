'use server';

import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { questRepository } from '@/data/quest';
import { validateUpdateNpcKnowledge, type IUpdateNpcKnowledge } from '@/domain/npc';

export const updateNpcKnowledge = async (id: string, input: IUpdateNpcKnowledge) => {
  const existing = await npcKnowledgeRepository.getById(id);
  if (!existing) throw new Error('Знание NPC не найдено.');
  validateUpdateNpcKnowledge(input, { reveal: existing.reveal, dc: existing.dc });

  if (input.questId) {
    const npc = await npcRepository.getById(existing.npcId);
    if (!npc) throw new Error('NPC не найден.');
    const quest = await questRepository.getById(input.questId);
    if (!quest) throw new Error('Квест не найден.');
    if (quest.campaignId !== npc.campaignId) throw new Error('Квест из другой кампании.');
  }

  return npcKnowledgeRepository.update(id, input);
};
