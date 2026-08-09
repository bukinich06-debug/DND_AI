'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { validateCreateLocation, type ICreateLocation } from '@/domain/location';

export const createLocation = async (input: ICreateLocation) => {
  validateCreateLocation(input);
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  if (input.parentId) {
    const parent = await locationRepository.getById(input.parentId);
    if (!parent) throw new Error('Родительская локация не найдена.');
    if (parent.campaignId !== input.campaignId) throw new Error('Родительская локация принадлежит другой кампании.');
  }

  return locationRepository.create(input);
};
