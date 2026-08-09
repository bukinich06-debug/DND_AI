'use server';

import { npcRepository } from '@/data/npc';

export const listNpcsByCampaign = async (campaignId: string) => npcRepository.listByCampaignId(campaignId);
