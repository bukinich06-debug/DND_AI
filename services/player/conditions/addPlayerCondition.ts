'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import {
  addCondition,
  CONDITION_RULES,
  normalizeConditionKey,
  validateAddPlayerCondition,
  type IAddPlayerCondition,
  type IPlayerConditions,
} from '@/domain/player';

export const addPlayerCondition = async (input: IAddPlayerCondition): Promise<IPlayerConditions> => {
  validateAddPlayerCondition(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const key = normalizeConditionKey(input.condition);
  if (!key) throw new Error('Неизвестное состояние.');

  const next = addCondition({
    state: { conditions: player.conditions, exhaustionLevel: player.exhaustionLevel },
    condition: key,
    exhaustionLevel: input.exhaustionLevel ?? undefined,
  });

  const updated = await playerRepository.update(player.id, {
    conditions: next.conditions,
    exhaustionLevel: next.exhaustionLevel,
  });

  const rules: Record<string, string> = {};
  for (const item of updated.conditions) {
    if (item in CONDITION_RULES) rules[item] = CONDITION_RULES[item as keyof typeof CONDITION_RULES];
  }

  return {
    playerId: updated.id,
    conditions: updated.conditions,
    exhaustionLevel: updated.exhaustionLevel,
    rules,
  };
};
