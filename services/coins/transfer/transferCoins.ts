'use server';

import { campaignRepository } from '@/data/campaign';
import { coinRepository } from '@/data/coins';
import { toCoins, validateTransferCoins, type ITransferCoins, type ITransferCoinsResult } from '@/domain/coins';
import { assertOwnerInCampaign } from '@/services/coins/helpers/assertOwnerInCampaign';

export const transferCoins = async (input: ITransferCoins): Promise<ITransferCoinsResult> => {
  validateTransferCoins(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  await assertOwnerInCampaign(input.campaignId, input.from);
  await assertOwnerInCampaign(input.campaignId, input.to);

  const result = await coinRepository.transfer({
    from: input.from,
    to: input.to,
    amountCp: input.amountCp,
  });

  return {
    from: {
      owner: input.from,
      coinsCp: result.fromCoinsCp,
      coins: toCoins(result.fromCoinsCp),
    },
    to: {
      owner: input.to,
      coinsCp: result.toCoinsCp,
      coins: toCoins(result.toCoinsCp),
    },
    amountCp: input.amountCp,
  };
};
