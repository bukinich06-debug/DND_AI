'use server';

import { npcRelationRepository, npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import {
  RELATION_CHANGE_RULES,
  applyRelationDelta,
  relationStance,
  validateNpcRelationChange,
  type INpcRelationChangeInput,
} from '@/domain/npc';
import { createNpcMemory } from '@/services/npc/memory/createNpcMemory';

interface IApplyNpcRelationChangeParams extends INpcRelationChangeInput {
  campaignId: string;
}

export const applyNpcRelationChange = async (input: IApplyNpcRelationChangeParams) => {
  validateNpcRelationChange(input);

  const npc = await npcRepository.getById(input.npcId);
  if (!npc) throw new Error('NPC не найден.');
  if (npc.campaignId !== input.campaignId) throw new Error('NPC не принадлежит этой кампании.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== npc.campaignId) throw new Error('Игрок из другой кампании.');

  const rule = RELATION_CHANGE_RULES[input.reason];
  const existing = await npcRelationRepository.get(input.npcId, input.playerId);
  const previousScore = existing?.score ?? 0;
  const score = applyRelationDelta(previousScore, rule.delta);

  const relation = await npcRelationRepository.upsert({
    npcId: input.npcId,
    playerId: input.playerId,
    score,
    note: existing?.note ?? null,
  });

  const memory = await createNpcMemory({
    npcId: input.npcId,
    playerId: input.playerId,
    summary: input.summary.trim(),
    kind: rule.memoryKind,
    importance: rule.importance,
  });

  return {
    relation,
    stance: relationStance(relation.score),
    delta: rule.delta,
    memory,
  };
};
