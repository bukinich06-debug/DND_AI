'use server';

import { questNpcRepository } from '@/data/quest';

export const listQuestNpcs = async (questId: string) => questNpcRepository.listByQuestId(questId);
