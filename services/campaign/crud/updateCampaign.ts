'use server';

import { campaignRepository } from '@/data/campaign';
import { validateUpdateCampaign, type IUpdateCampaign } from '@/domain/campaign';

export const updateCampaign = async (id: string, input: IUpdateCampaign) => {
  validateUpdateCampaign(input);
  const existing = await campaignRepository.getById(id);
  if (!existing) throw new Error('Кампания не найдена.');
  return campaignRepository.update(id, input);
};
