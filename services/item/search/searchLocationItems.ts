'use server';

import { campaignRepository } from '@/data/campaign';
import { itemRepository } from '@/data/item';
import { locationRepository } from '@/data/location';
import {
  matchItems,
  validateSearchLocationItems,
  type ISearchLocationItems,
  type ISearchLocationItemsResult,
} from '@/domain/item';

export const searchLocationItems = async (input: ISearchLocationItems): Promise<ISearchLocationItemsResult> => {
  validateSearchLocationItems(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const location = await locationRepository.getById(input.locationId);
  if (!location) throw new Error('Локация не найдена.');
  if (location.campaignId !== input.campaignId) throw new Error('Локация не принадлежит этой кампании.');

  const onFloor = await itemRepository.listByLocationId(input.locationId);
  const matched = matchItems(onFloor, input.query);

  return {
    locationId: input.locationId,
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
      equipSlot: item.equipSlot,
      toolKey: item.toolKey,
    })),
  };
};
