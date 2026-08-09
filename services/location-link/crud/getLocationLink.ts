'use server';

import { locationLinkRepository } from '@/data/location-link';

export const getLocationLink = async (id: string) => {
  const link = await locationLinkRepository.getById(id);
  if (!link) throw new Error('Путь не найден.');
  return link;
};
