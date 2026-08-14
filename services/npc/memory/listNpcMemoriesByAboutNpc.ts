'use server';

import { npcMemoryRepository } from '@/data/npc';

export const listNpcMemoriesByAboutNpc = async (aboutNpcId: string) => {
  if (!aboutNpcId.trim()) throw new Error('aboutNpcId обязателен.');
  return npcMemoryRepository.listByAboutNpcId(aboutNpcId.trim());
};
