'use server';

import { npcAcquaintanceRepository, npcRepository } from '@/data/npc';

export const listNpcAcquaintances = async (npcId: string) => {
  if (!npcId.trim()) throw new Error('npcId обязателен.');
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');
  return npcAcquaintanceRepository.listByNpcId(npcId);
};
