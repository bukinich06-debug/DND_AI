'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import {
  CONDITION_RULES,
  Condition,
  validateGetPlayerConditions,
  type IGetPlayerConditions,
  type IPlayerConditions,
} from '@/domain/player';

export const getPlayerConditions = async (input: IGetPlayerConditions): Promise<IPlayerConditions> => {
  validateGetPlayerConditions(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const rules: Record<string, string> = {};
  for (const key of player.conditions) {
    if (key in CONDITION_RULES) rules[key] = CONDITION_RULES[key as Condition];
  }

  return {
    playerId: player.id,
    conditions: player.conditions,
    exhaustionLevel: player.exhaustionLevel,
    dead: player.dead,
    rules,
  };
};
