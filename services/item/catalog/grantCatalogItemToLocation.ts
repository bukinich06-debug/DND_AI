'use server';

import { itemRepository } from '@/data/item';
import { locationRepository } from '@/data/location';
import { catalogToCreateItem, findStackItem, getCatalogItemByKey } from '@/domain/item';
import { createItem } from '@/services/item/crud/createItem';
import { updateItem } from '@/services/item/crud/updateItem';

interface IGrantCatalogItemToLocation {
  campaignId: string;
  locationId: string;
  key: string;
  quantity?: number;
}

export const grantCatalogItemToLocation = async (input: IGrantCatalogItemToLocation) => {
  if (!input.campaignId?.trim()) throw new Error('ID кампании обязателен.');
  if (!input.locationId?.trim()) throw new Error('ID локации обязателен.');
  if (!input.key?.trim()) throw new Error('Ключ предмета обязателен.');
  if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity < 1))
    throw new Error('Количество должно быть не меньше 1.');

  const location = await locationRepository.getById(input.locationId.trim());
  if (!location) throw new Error('Локация не найдена.');
  if (location.campaignId !== input.campaignId) throw new Error('Локация не принадлежит этой кампании.');

  const entry = getCatalogItemByKey(input.key.trim());
  const add = input.quantity ?? 1;
  const onFloor = await itemRepository.listByLocationId(location.id);
  const stack = findStackItem(onFloor, entry.key);

  if (stack) return updateItem(stack.id, { quantity: stack.quantity + add });

  return createItem({
    campaignId: input.campaignId,
    name: entry.name,
    kind: entry.kind,
    rarity: entry.rarity,
    description: entry.description,
    weight: entry.weight,
    valueCp: entry.valueCp,
    isMagical: entry.isMagical,
    properties: entry.properties,
    quantity: add,
    catalogKey: entry.key,
    playerId: null,
    npcId: null,
    locationId: location.id,
  });
};
