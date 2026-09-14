'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import {
  syncDeath,
  syncUnconscious,
  validateApplyPlayerHp,
  type IApplyPlayerHp,
  type IApplyPlayerHpResult,
} from '@/domain/player';

export const applyPlayerHp = async (input: IApplyPlayerHp): Promise<IApplyPlayerHpResult> => {
  validateApplyPlayerHp(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  if (player.dead) throw new Error('Невозможно изменить HP мёртвого персонажа.');

  const hpCurrent = Math.min(player.hpMax, Math.max(0, player.hpCurrent + input.delta));
  const next = syncUnconscious(hpCurrent, {
    conditions: player.conditions,
    exhaustionLevel: player.exhaustionLevel,
  });
  const dead = syncDeath(next.exhaustionLevel, player.dead);

  const updated = await playerRepository.update(player.id, {
    hpCurrent,
    conditions: next.conditions,
    exhaustionLevel: next.exhaustionLevel,
    dead,
  });

  return {
    playerId: updated.id,
    hpMax: updated.hpMax,
    hpCurrent: updated.hpCurrent,
    hpTemp: updated.hpTemp,
    conditions: updated.conditions,
    exhaustionLevel: updated.exhaustionLevel,
    dead: updated.dead,
  };
};
