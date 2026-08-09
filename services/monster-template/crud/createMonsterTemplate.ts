'use server';

import { campaignRepository } from '@/data/campaign';
import { monsterTemplateRepository } from '@/data/monster-template';
import { validateCreateMonsterTemplate, type ICreateMonsterTemplate } from '@/domain/monster-template';

export const createMonsterTemplate = async (input: ICreateMonsterTemplate) => {
  validateCreateMonsterTemplate(input);
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');
  return monsterTemplateRepository.create(input);
};
