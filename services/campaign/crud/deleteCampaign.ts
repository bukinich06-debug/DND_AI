'use server';

import { campaignRepository } from '@/data/campaign';

export const deleteCampaign = async (id: string) => {
  const existing = await campaignRepository.getById(id);
  if (!existing) throw new Error('Кампания не найдена.');
  await campaignRepository.delete(id);
};
