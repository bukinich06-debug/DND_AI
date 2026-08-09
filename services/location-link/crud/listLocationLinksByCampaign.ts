'use server';

import { campaignRepository } from '@/data/campaign';
import { locationLinkRepository } from '@/data/location-link';

export const listLocationLinksByCampaign = async (campaignId: string) => {
  if (!campaignId.trim()) throw new Error('Кампания обязательна.');
  const campaign = await campaignRepository.getById(campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');
  return locationLinkRepository.listByCampaignId(campaignId);
};
