'use server';

import { locationRepository } from '@/data/location';

export const listLocationsByCampaign = async (campaignId: string) => locationRepository.listByCampaignId(campaignId);
