'use server';

import { campaignRepository } from '@/data/campaign';
import { npcRepository } from '@/data/npc';
import { validateCreateNpc, type ICreateNpc } from '@/domain/npc';

export const createNpc = async (input: ICreateNpc) => {
  validateCreateNpc(input);
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');
  return npcRepository.create(input);
};
