'use server';

import { campaignRepository } from '@/data/campaign';
import { itemRepository } from '@/data/item';
import { playerRepository } from '@/data/player';
import {
  matchItems,
  validateSearchPlayerItems,
  type ISearchPlayerItems,
  type ISearchPlayerItemsResult,
} from '@/domain/item';

export const searchPlayerItems = async (input: ISearchPlayerItems): Promise<ISearchPlayerItemsResult> => {
  validateSearchPlayerItems(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const inventory = await itemRepository.listByPlayerId(input.playerId);
  const matched = matchItems(inventory, input.query);

  return {
    playerId: input.playerId,
    query: input.query?.trim() ? input.query.trim() : null,
    exact: matched.exact,
    items: matched.items.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      quantity: item.quantity,
      description: item.description,
      properties: item.properties,
      isMagical: item.isMagical,
      toolKey: item.toolKey,
    })),
  };
};
