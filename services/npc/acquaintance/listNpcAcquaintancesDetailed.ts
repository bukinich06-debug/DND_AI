'use server';

import { npcAcquaintanceRepository, npcRepository } from '@/data/npc';

export interface INpcAcquaintanceDetailed {
  otherNpcId: string;
  note: string | null;
  name: string;
  title: string | null;
}

export const listNpcAcquaintancesDetailed = async (
  npcId: string
): Promise<INpcAcquaintanceDetailed[]> => {
  if (!npcId.trim()) throw new Error('npcId обязателен.');
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');

  const links = await npcAcquaintanceRepository.listByNpcId(npcId);
  const result: INpcAcquaintanceDetailed[] = [];

  for (const link of links) {
    const other = await npcRepository.getById(link.otherNpcId);
    if (!other) continue;
    result.push({
      otherNpcId: link.otherNpcId,
      note: link.note,
      name: other.name,
      title: other.title,
    });
  }

  return result;
};
