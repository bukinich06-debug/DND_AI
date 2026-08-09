'use server';

import { campaignRepository } from '@/data/campaign';

export const listCampaigns = async () => campaignRepository.list();
