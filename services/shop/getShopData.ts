'use server';

import { itemRepository } from '@/data/item';
import { getSpecialtyByKey } from '@/domain/shop/specialty';
import type { IShopData, IShopItem } from '@/domain/shop';
import { getNpc } from '@/services/npc/crud/getNpc';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { ensureShopStock } from './ensureShopStock';

export const getShopData = async (npcId: string, playerId: string): Promise<IShopData> => {
  const npc = await getNpc(npcId);
  if (!npc.shopSpecialtyKey) throw new Error('NPC не является торговцем.');

  const specialty = getSpecialtyByKey(npc.shopSpecialtyKey);
  const player = await getPlayer(playerId);

  if (player.campaignId !== npc.campaignId) throw new Error('Игрок и NPC принадлежат разным кампаниям.');

  await ensureShopStock(npc.id);

  const items = await itemRepository.listByNpcId(npc.id);

  const shopItems: IShopItem[] = items
    .filter((item) => item.valueCp !== null && item.valueCp > 0)
    .map((item) => ({
      id: item.id,
      catalogKey: item.catalogKey,
      name: item.name,
      kind: item.kind,
      description: item.description,
      quantity: item.quantity,
      priceCp: item.valueCp!,
      rarity: item.rarity,
      isMagical: item.isMagical,
    }));

  return {
    npcId: npc.id,
    npcName: npc.name,
    specialtyKey: specialty.key,
    specialtyName: specialty.name,
    playerCoinsCp: player.coinsCp,
    items: shopItems,
  };
};
