'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import { Condition, removeCondition, validateLongRest, type ILongRest, type IPlayerRestResult } from '@/domain/player';
import { snapToNextMorning } from '@/domain/world-clock';

export const longRest = async (input: ILongRest): Promise<IPlayerRestResult> => {
  validateLongRest(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const recovered = Math.max(1, Math.floor(player.level / 2));
  const hitDiceLeft = Math.min(player.level, player.hitDiceLeft + recovered);
  const next = removeCondition({
    state: { conditions: player.conditions, exhaustionLevel: player.exhaustionLevel },
    condition: Condition.exhaustion,
  });
  const awake = removeCondition({
    state: next,
    condition: Condition.unconscious,
  });

  const newClock = snapToNextMorning({ dayIndex: campaign.dayIndex, timeOfDay: campaign.timeOfDay });

  await campaignRepository.update(campaign.id, {
    dayIndex: newClock.dayIndex,
    timeOfDay: newClock.timeOfDay,
  });

  const updated = await playerRepository.update(player.id, {
    hpCurrent: player.hpMax,
    hpTemp: 0,
    hitDiceLeft,
    conditions: awake.conditions,
    exhaustionLevel: awake.exhaustionLevel,
    shortRestsToday: 0,
    shortRestDayIndex: newClock.dayIndex,
  });

  return {
    playerId: updated.id,
    hpMax: updated.hpMax,
    hpCurrent: updated.hpCurrent,
    hpTemp: updated.hpTemp,
    hitDiceLeft: updated.hitDiceLeft,
    conditions: updated.conditions,
    exhaustionLevel: updated.exhaustionLevel,
    healed: player.hpMax - player.hpCurrent,
  };
};
