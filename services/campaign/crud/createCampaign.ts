'use server';

import { campaignRepository } from '@/data/campaign';
import { validateCreateCampaign, type ICreateCampaign } from '@/domain/campaign';

export const createCampaign = async (input: ICreateCampaign) => {
  validateCreateCampaign(input);
  return campaignRepository.create(input);
};
