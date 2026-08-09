'use server';

import { locationRepository } from '@/data/location';

export const getLocation = async (id: string) => {
  const location = await locationRepository.getById(id);
  if (!location) throw new Error('Локация не найдена.');
  return location;
};
