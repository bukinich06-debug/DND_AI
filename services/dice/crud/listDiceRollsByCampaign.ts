'use server';

import { diceRollRepository } from '@/data/dice';

export const listDiceRollsByCampaign = async (campaignId: string) => diceRollRepository.listByCampaignId(campaignId);
