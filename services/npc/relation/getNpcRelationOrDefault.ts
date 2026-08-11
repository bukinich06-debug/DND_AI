'use server';

import { npcRelationRepository, npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { relationStance } from '@/domain/npc';

export const getNpcRelationOrDefault = async (npcId: string, playerId: string, campaignId: string) => {
  const npc = await npcRepository.getById(npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  const player = await playerRepository.getById(playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== npc.campaignId) throw new Error('Игрок из другой кампании.');

  const existing = await npcRelationRepository.get(npcId, playerId);
  const relation = existing ?? { npcId, playerId, score: 0, note: null };

  return {
    ...relation,
    stance: relationStance(relation.score),
  };
};
