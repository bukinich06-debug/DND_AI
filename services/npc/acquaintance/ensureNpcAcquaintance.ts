'use server';

import { npcAcquaintanceRepository, npcRepository } from '@/data/npc';
import { validateSetNpcAcquaintance, type ISetNpcAcquaintance } from '@/domain/npc';

export const ensureNpcAcquaintance = async (input: ISetNpcAcquaintance) => {
  validateSetNpcAcquaintance(input);

  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');

  const other = await npcRepository.getById(input.otherNpcId);
  if (!other) throw new Error('Знакомый NPC не найден.');
  if (other.campaignId !== npc.campaignId) throw new Error('NPC должны быть в одной кампании.');

  return npcAcquaintanceRepository.upsert(input);
};
