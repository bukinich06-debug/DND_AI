'use server';

import { campaignRepository } from '@/data/campaign';

export const getCampaign = async (id: string) => {
  const campaign = await campaignRepository.getById(id);
  if (!campaign) throw new Error('Кампания не найдена.');
  return campaign;
};
