'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import { rollDie } from '@/domain/dice';
import {
  abilityMod,
  parseHitDie,
  syncUnconscious,
  validateShortRest,
  type IPlayerRestResult,
  type IShortRest,
} from '@/domain/player';

export const shortRest = async (input: IShortRest): Promise<IPlayerRestResult> => {
  validateShortRest(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');
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

  const updated = await playerRepository.update(player.id, {
    hpCurrent,
    hitDiceLeft,
    conditions: next.conditions,
    exhaustionLevel: next.exhaustionLevel,
  });

  return {
    playerId: updated.id,
    hpMax: updated.hpMax,
    hpCurrent: updated.hpCurrent,
    hpTemp: updated.hpTemp,
    hitDiceLeft: updated.hitDiceLeft,
    conditions: updated.conditions,
    exhaustionLevel: updated.exhaustionLevel,
    healed,
    dice,
  };
};
