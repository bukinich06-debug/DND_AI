'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import { validateCreatePlayer, type ICreatePlayer } from '@/domain/player';

export const createPlayer = async (input: ICreatePlayer) => {
  validateCreatePlayer(input);
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');
  return playerRepository.create(input);
};
