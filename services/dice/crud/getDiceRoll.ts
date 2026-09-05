'use server';

import { diceRollRepository } from '@/data/dice';

export const getDiceRoll = async (id: string) => {
  const roll = await diceRollRepository.getById(id);
  if (!roll) throw new Error('Бросок не найден.');
  return roll;
};
