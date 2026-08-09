'use server';

import { npcRepository } from '@/data/npc';
import { validateUpdateNpc, type IUpdateNpc } from '@/domain/npc';

export const updateNpc = async (id: string, input: IUpdateNpc) => {
  validateUpdateNpc(input);
  const existing = await npcRepository.getById(id);
  if (!existing) throw new Error('NPC не найден.');
  return npcRepository.update(id, input);
};
