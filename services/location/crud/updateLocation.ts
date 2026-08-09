'use server';

import { locationRepository } from '@/data/location';
import { validateUpdateLocation, wouldCreateLocationCycle, type IUpdateLocation } from '@/domain/location';

export const updateLocation = async (id: string, input: IUpdateLocation) => {
  validateUpdateLocation(input);
  const existing = await locationRepository.getById(id);
  if (!existing) throw new Error('Локация не найдена.');

  if (input.parentId !== undefined && input.parentId !== null) {
    const parent = await locationRepository.getById(input.parentId);
    if (!parent) throw new Error('Родительская локация не найдена.');
    if (parent.campaignId !== existing.campaignId) throw new Error('Родительская локация принадлежит другой кампании.');

    const campaignLocations = await locationRepository.listByCampaignId(existing.campaignId);
    const parentById = new Map(campaignLocations.map((loc) => [loc.id, loc.parentId]));
    if (wouldCreateLocationCycle(id, input.parentId, (locId) => parentById.get(locId) ?? null))
      throw new Error('Нельзя сделать локацию потомком самой себя.');
  }

  return locationRepository.update(id, input);
};
