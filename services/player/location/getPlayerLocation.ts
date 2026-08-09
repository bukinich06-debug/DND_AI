'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import { validateGetPlayerLocation, type IGetPlayerLocation, type IPlayerLocation } from '@/domain/player';
import { buildPlayerLocation } from './helpers/buildPlayerLocation';

export const getPlayerLocation = async (input: IGetPlayerLocation): Promise<IPlayerLocation> => {
  validateGetPlayerLocation(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  return buildPlayerLocation(player);
};
