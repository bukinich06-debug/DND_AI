'use server';

import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { validateUpsertNpcStatBlock, type IUpsertNpcStatBlock } from '@/domain/npc';

export const upsertNpcStatBlock = async (input: IUpsertNpcStatBlock) => {
  validateUpsertNpcStatBlock(input);
  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');
  return npcStatBlockRepository.upsert(input);
};
