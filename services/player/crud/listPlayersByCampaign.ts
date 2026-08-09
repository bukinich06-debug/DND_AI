'use server';

import { playerRepository } from '@/data/player';

export const listPlayersByCampaign = async (campaignId: string) => playerRepository.listByCampaignId(campaignId);
