'use server';

import { locationRepository } from '@/data/location';
import { locationLinkRepository } from '@/data/location-link';
import { validateUpdateLocationLink, type IUpdateLocationLink } from '@/domain/location-link';

export const updateLocationLink = async (id: string, input: IUpdateLocationLink) => {
  validateUpdateLocationLink(input);

  const existing = await locationLinkRepository.getById(id);
  if (!existing) throw new Error('Путь не найден.');

  const fromId = input.fromId ?? existing.fromId;
  const toId = input.toId ?? existing.toId;
  if (fromId === toId) throw new Error('Начало и конец пути не могут совпадать.');

  if (input.fromId !== undefined) {
    const from = await locationRepository.getById(input.fromId);
    if (!from) throw new Error('Начальная локация не найдена.');
    if (from.campaignId !== existing.campaignId) throw new Error('Начальная локация из другой кампании.');
  }

  if (input.toId !== undefined) {
    const to = await locationRepository.getById(input.toId);
    if (!to) throw new Error('Конечная локация не найдена.');
    if (to.campaignId !== existing.campaignId) throw new Error('Конечная локация из другой кампании.');
  }

  return locationLinkRepository.update(id, input);
};
