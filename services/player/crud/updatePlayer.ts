'use server';

import { locationRepository } from '@/data/location';
import { playerRepository } from '@/data/player';
import { validateUpdatePlayer, type IUpdatePlayer } from '@/domain/player';

export const updatePlayer = async (id: string, input: IUpdatePlayer) => {
  validateUpdatePlayer(input);
  const existing = await playerRepository.getById(id);
  if (!existing) throw new Error('Персонаж не найден.');

  const hpMax = input.hpMax ?? existing.hpMax;
  const hpCurrent = input.hpCurrent ?? existing.hpCurrent;
  if (hpCurrent > hpMax) throw new Error('Текущие хиты не могут превышать максимум.');

  if (input.locationId) {
    const location = await locationRepository.getById(input.locationId);
    if (!location) throw new Error('Локация не найдена.');
    if (location.campaignId !== existing.campaignId) throw new Error('Локация из другой кампании.');
  }

  return playerRepository.update(id, input);
};
