'use server';

import { campaignRepository } from '@/data/campaign';
import { validateAdvanceTime, type IAdvanceTime } from '@/domain/player';
import { advanceSlots } from '@/domain/world-clock';

interface IAdvanceTimeResult {
  campaignId: string;
  dayIndex: number;
  timeOfDay: string;
}

export const advanceTime = async (input: IAdvanceTime): Promise<IAdvanceTimeResult> => {
  validateAdvanceTime(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const newClock = advanceSlots({ dayIndex: campaign.dayIndex, timeOfDay: campaign.timeOfDay }, input.slots);

  const updated = await campaignRepository.update(campaign.id, {
    dayIndex: newClock.dayIndex,
    timeOfDay: newClock.timeOfDay,
  });

  return {
    campaignId: updated.id,
    dayIndex: updated.dayIndex,
    timeOfDay: updated.timeOfDay,
  };
};
