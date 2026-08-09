'use server';

import { playerRepository } from '@/data/player';
import { validateUpdatePlayer, type IUpdatePlayer } from '@/domain/player';

export const updatePlayer = async (id: string, input: IUpdatePlayer) => {
  validateUpdatePlayer(input);
  const existing = await playerRepository.getById(id);
  if (!existing) throw new Error('Персонаж не найден.');

  const hpMax = input.hpMax ?? existing.hpMax;
  const hpCurrent = input.hpCurrent ?? existing.hpCurrent;
  if (hpCurrent > hpMax) throw new Error('Текущие хиты не могут превышать максимум.');

  return playerRepository.update(id, input);
};
