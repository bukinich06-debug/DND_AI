'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { playerRepository } from '@/data/player';
import { validateCreatePlayer, type ICreatePlayer } from '@/domain/player';

export const createPlayer = async (input: ICreatePlayer) => {
  validateCreatePlayer(input);
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  if (input.locationId) {
    const location = await locationRepository.getById(input.locationId);
    if (!location) throw new Error('Локация не найдена.');
    if (location.campaignId !== input.campaignId) throw new Error('Локация из другой кампании.');
  }

  return playerRepository.create(input);
};
