'use server';

import { npcRelationRepository, npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { validateSetNpcRelation, type ISetNpcRelation } from '@/domain/npc';

export const setNpcRelation = async (input: ISetNpcRelation) => {
  validateSetNpcRelation(input);

  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== npc.campaignId) throw new Error('Игрок из другой кампании.');

  return npcRelationRepository.upsert(input);
};
