'use server';

import { locationLinkRepository } from '@/data/location-link';

export const deleteLocationLink = async (id: string) => {
  const existing = await locationLinkRepository.getById(id);
  if (!existing) throw new Error('Путь не найден.');
  await locationLinkRepository.delete(id);
};
