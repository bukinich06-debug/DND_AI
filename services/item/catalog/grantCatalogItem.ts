'use server';

import {
  catalogToCreateItem,
  getCatalogItemByKey,
  validateGrantCatalogItem,
  type IGrantCatalogItem,
} from '@/domain/item';
import { createItem } from '@/services/item/crud/createItem';
import { getPlayer } from '@/services/player/crud/getPlayer';

export const grantCatalogItem = async (input: IGrantCatalogItem) => {
  validateGrantCatalogItem(input);
  const player = await getPlayer(input.playerId.trim());
  const entry = getCatalogItemByKey(input.key.trim());
  return createItem(
    catalogToCreateItem({
      entry,
      campaignId: player.campaignId,
      playerId: player.id,
      quantity: input.quantity ?? 1,
    })
  );
};
