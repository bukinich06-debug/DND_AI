'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { playerRepository } from '@/data/player';
import { validateMovePlayer, type IMovePlayer, type IPlayerLocation } from '@/domain/player';
import { buildPlayerLocation, clearTravelState } from './helpers/buildPlayerLocation';

export const movePlayer = async (input: IMovePlayer): Promise<IPlayerLocation> => {
  validateMovePlayer(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const location = await locationRepository.getById(input.locationId);
  if (!location) throw new Error('Локация не найдена.');
  if (location.campaignId !== input.campaignId) throw new Error('Локация из другой кампании.');

  const updated = await playerRepository.updateLocationState(player.id, {
    locationId: location.id,
    ...clearTravelState,
  });

  return buildPlayerLocation(updated);
};
