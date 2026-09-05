'use server';

import { itemRepository } from '@/data/item';
import { locationRepository } from '@/data/location';

export const listItemsByLocation = async (locationId: string) => {
  const location = await locationRepository.getById(locationId);
  if (!location) throw new Error('Локация не найдена.');
  return itemRepository.listByLocationId(locationId);
};
