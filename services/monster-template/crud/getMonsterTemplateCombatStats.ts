'use server';

import { mapMonsterTemplateToCombat } from '@/domain/combat';
import { monsterTemplateRepository } from '@/data/monster-template';

export const getMonsterTemplateCombatStats = async (id: string) => {
  const template = await monsterTemplateRepository.getById(id);
  if (!template) throw new Error('Шаблон монстра не найден.');
  return mapMonsterTemplateToCombat(template);
};
