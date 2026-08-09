'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { locationLinkRepository } from '@/data/location-link';
import { validateCreateLocationLink, type ICreateLocationLink } from '@/domain/location-link';

export const createLocationLink = async (input: ICreateLocationLink) => {
  validateCreateLocationLink(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const from = await locationRepository.getById(input.fromId);
  if (!from) throw new Error('Начальная локация не найдена.');
  if (from.campaignId !== input.campaignId) throw new Error('Начальная локация из другой кампании.');

  const to = await locationRepository.getById(input.toId);
  if (!to) throw new Error('Конечная локация не найдена.');
  if (to.campaignId !== input.campaignId) throw new Error('Конечная локация из другой кампании.');

  return locationLinkRepository.create(input);
};
