'use server';

import { campaignRepository } from '@/data/campaign';
import { toCoins, validateGetCoins, type ICoinBalance, type IGetCoins } from '@/domain/coins';
import { assertOwnerInCampaign } from '@/services/coins/helpers/assertOwnerInCampaign';

export const getCoins = async (input: IGetCoins): Promise<ICoinBalance> => {
  validateGetCoins(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const purse = await assertOwnerInCampaign(input.campaignId, input.owner);

  return {
    owner: input.owner,
    coinsCp: purse.coinsCp,
    coins: toCoins(purse.coinsCp),
  };
};
