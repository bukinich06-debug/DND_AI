'use server';

import { itemRepository } from '@/data/item';

export const listItemsByCampaign = async (campaignId: string) => itemRepository.listByCampaignId(campaignId);
