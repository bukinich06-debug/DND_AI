'use server';

import { itemRepository } from '@/data/item';
import {
  catalogToCreateItem,
  findStackItem,
  getCatalogItemByKey,
  validateGrantCatalogItem,
  type IGrantCatalogItem,
} from '@/domain/item';
import { createItem } from '@/services/item/crud/createItem';
import { updateItem } from '@/services/item/crud/updateItem';
import { getPlayer } from '@/services/player/crud/getPlayer';

export const grantCatalogItem = async (input: IGrantCatalogItem) => {
  validateGrantCatalogItem(input);

  const player = await getPlayer(input.playerId.trim());
  const entry = getCatalogItemByKey(input.key.trim());
  const add = input.quantity ?? 1;
  const inventory = await itemRepository.listByPlayerId(player.id);
  const stack = findStackItem(inventory, entry.key);
  if (stack) return updateItem(stack.id, { quantity: stack.quantity + add });

  return createItem(
    catalogToCreateItem({
      entry,
      campaignId: player.campaignId,
      playerId: player.id,
      quantity: add,
    })
  );
};
