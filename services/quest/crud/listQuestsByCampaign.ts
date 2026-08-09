'use server';

import { questRepository } from '@/data/quest';

export const listQuestsByCampaign = async (campaignId: string) => questRepository.listByCampaignId(campaignId);
