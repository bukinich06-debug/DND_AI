'use server';

import { monsterTemplateRepository } from '@/data/monster-template';

export const deleteMonsterTemplate = async (id: string) => {
  const existing = await monsterTemplateRepository.getById(id);
  if (!existing) throw new Error('Шаблон монстра не найден.');
  await monsterTemplateRepository.delete(id);
};
