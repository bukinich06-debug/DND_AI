'use server';

import { monsterTemplateRepository } from '@/data/monster-template';
import { validateUpdateMonsterTemplate, type IUpdateMonsterTemplate } from '@/domain/monster-template';

export const updateMonsterTemplate = async (id: string, input: IUpdateMonsterTemplate) => {
  validateUpdateMonsterTemplate(input);
  const existing = await monsterTemplateRepository.getById(id);
  if (!existing) throw new Error('Шаблон монстра не найден.');
  return monsterTemplateRepository.update(id, input);
};
