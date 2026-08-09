'use server';

import { monsterTemplateRepository } from '@/data/monster-template';

export const listMonsterTemplatesByCampaign = async (campaignId: string) =>
  monsterTemplateRepository.listByCampaignId(campaignId);
