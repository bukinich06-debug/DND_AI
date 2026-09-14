'use server';

import { itemRepository } from '@/data/item';
import { catalogToCreateItem, getCatalogItemByKey } from '@/domain/item';
import { getNpc } from '@/services/npc/crud/getNpc';
import { getSpecialtyByKey } from '@/domain/shop/specialty';

export const ensureShopStock = async (npcId: string) => {
  const npc = await getNpc(npcId);
  if (!npc.shopSpecialtyKey) throw new Error('NPC не является торговцем (нет shopSpecialtyKey).');

  const specialty = getSpecialtyByKey(npc.shopSpecialtyKey);
  const inventory = await itemRepository.listByNpcId(npc.id);

  const existingKeys = new Set(inventory.map((item) => item.catalogKey).filter(Boolean));
  const missingKeys = specialty.catalogKeys.filter((key) => !existingKeys.has(key));

  if (missingKeys.length === 0) return;

  for (const key of missingKeys) {
    try {
      const entry = getCatalogItemByKey(key);
      await itemRepository.create(
        catalogToCreateItem({
          entry,
          campaignId: npc.campaignId,
          npcId: npc.id,
          quantity: 1,
        })
      );
    } catch (error) {
      console.warn(`Не удалось добавить предмет "${key}" в магазин NPC ${npc.id}:`, error);
    }
  }
};
