'use server';

import { campaignRepository } from '@/data/campaign';
import { diceRollRepository } from '@/data/dice';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { DIE_SIDES, rollDie, validateRollDice, type IRollDice } from '@/domain/dice';

export const rollDice = async (input: IRollDice) => {
  validateRollDice(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  if (input.playerId) {
    const player = await playerRepository.getById(input.playerId);
    if (!player) throw new Error('Игрок не найден.');
    if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');
  }

  if (input.npcId) {
    const npc = await npcRepository.getById(input.npcId);
    if (!npc) throw new Error('NPC не найден.');
    if (npc.campaignId !== input.campaignId) throw new Error('NPC не принадлежит этой кампании.');
  }

  const value = rollDie(DIE_SIDES[input.die]);

  return diceRollRepository.create({
    campaignId: input.campaignId,
    die: input.die,
    value,
    note: input.note ?? null,
    playerId: input.playerId ?? null,
    npcId: input.npcId ?? null,
  });
};
