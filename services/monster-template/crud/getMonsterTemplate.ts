'use server';

import { monsterTemplateRepository } from '@/data/monster-template';

export const getMonsterTemplate = async (id: string) => {
  const template = await monsterTemplateRepository.getById(id);
  if (!template) throw new Error('Шаблон монстра не найден.');
  return template;
};
