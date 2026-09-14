'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import { rollDie } from '@/domain/dice';
import {
  abilityMod,
  parseHitDie,
  syncDeath,
  syncUnconscious,
  validateShortRest,
  type IPlayerRestResult,
  type IShortRest,
} from '@/domain/player';
import { advanceSlots } from '@/domain/world-clock';

export const shortRest = async (input: IShortRest): Promise<IPlayerRestResult> => {
  validateShortRest(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  if (player.dead) throw new Error('Мёртвый персонаж не может отдыхать.');

  if (player.shortRestDayIndex === campaign.dayIndex && player.shortRestsToday >= 2)
    throw new Error('Вы уже использовали 2 коротких отдыха за сегодня.');

  if (input.hitDice > player.hitDiceLeft) throw new Error('Недостаточно костей хитов.');

  const { sides } = parseHitDie(player.hitDie);
  const conMod = abilityMod(player.con);
  const dice: IPlayerRestResult['dice'] = [];
  let healed = 0;

  for (let i = 0; i < input.hitDice; i += 1) {
    const value = rollDie(sides);
    const gain = Math.max(1, value + conMod);
    healed += gain;
    dice.push({ die: `d${sides}`, value, conMod });
  }

  const hpCurrent = Math.min(player.hpMax, player.hpCurrent + healed);
  const hitDiceLeft = player.hitDiceLeft - input.hitDice;
  const next = syncUnconscious(hpCurrent, {
    conditions: player.conditions,
    exhaustionLevel: player.exhaustionLevel,
  });
  const dead = syncDeath(next.exhaustionLevel, player.dead);

  const newClock = advanceSlots({ dayIndex: campaign.dayIndex, timeOfDay: campaign.timeOfDay }, 1);

  const shortRestsToday =
    player.shortRestDayIndex === campaign.dayIndex ? player.shortRestsToday + 1 : 1;

  await campaignRepository.update(campaign.id, {
    dayIndex: newClock.dayIndex,
    timeOfDay: newClock.timeOfDay,
  });

  const updated = await playerRepository.update(player.id, {
    hpCurrent,
    hitDiceLeft,
    conditions: next.conditions,
    exhaustionLevel: next.exhaustionLevel,
    dead,
    shortRestsToday,
    shortRestDayIndex: campaign.dayIndex,
  });

  return {
    playerId: updated.id,
    hpMax: updated.hpMax,
    hpCurrent: updated.hpCurrent,
    hpTemp: updated.hpTemp,
    hitDiceLeft: updated.hitDiceLeft,
    conditions: updated.conditions,
    exhaustionLevel: updated.exhaustionLevel,
    dead: updated.dead,
    healed,
    dice,
  };
};
