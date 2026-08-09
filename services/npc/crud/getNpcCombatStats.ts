'use server';

import { mapNpcStatBlockToCombat } from '@/domain/combat';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';

export const getNpcCombatStats = async (npcId: string) => {
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');
  const block = await npcStatBlockRepository.getByNpcId(npcId);
  if (!block) throw new Error('Статблок NPC не найден.');
  return mapNpcStatBlockToCombat(block, npc.name);
};
