'use server';

import { locationRepository } from '@/data/location';
import { questRepository } from '@/data/quest';
import { validateUpdateQuest, type IUpdateQuest } from '@/domain/quest';

export const updateQuest = async (id: string, input: IUpdateQuest) => {
  validateUpdateQuest(input);
  const existing = await questRepository.getById(id);
  if (!existing) throw new Error('Квест не найден.');

  if (input.locationId) {
    const location = await locationRepository.getById(input.locationId);
    if (!location) throw new Error('Локация не найдена.');
    if (location.campaignId !== existing.campaignId) throw new Error('Локация из другой кампании.');
  }

  return questRepository.update(id, input);
};
