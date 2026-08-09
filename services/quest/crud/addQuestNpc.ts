'use server';

import { npcRepository } from '@/data/npc';
import { questNpcRepository, questRepository } from '@/data/quest';
import { validateAddQuestNpc, type IAddQuestNpc } from '@/domain/quest';

export const addQuestNpc = async (input: IAddQuestNpc) => {
  validateAddQuestNpc(input);
  const quest = await questRepository.getById(input.questId);
  if (!quest) throw new Error('Квест не найден.');
  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (npc.campaignId !== quest.campaignId) throw new Error('NPC и квест из разных кампаний.');
  return questNpcRepository.add(input);
};
