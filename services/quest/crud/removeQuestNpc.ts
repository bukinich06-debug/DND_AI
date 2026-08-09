'use server';

import { questNpcRepository } from '@/data/quest';
import type { QuestNpcRole } from '@/domain/shared';

export const removeQuestNpc = async (questId: string, npcId: string, role: QuestNpcRole) => {
  const links = await questNpcRepository.listByQuestId(questId);
  const existing = links.find((link) => link.npcId === npcId && link.role === role);
  if (!existing) throw new Error('Связь NPC с квестом не найдена.');
  await questNpcRepository.remove(questId, npcId, role);
};
