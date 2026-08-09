'use server';

import { locationRepository } from '@/data/location';

export const deleteLocation = async (id: string) => {
  const existing = await locationRepository.getById(id);
  if (!existing) throw new Error('Локация не найдена.');
  await locationRepository.delete(id);
};
