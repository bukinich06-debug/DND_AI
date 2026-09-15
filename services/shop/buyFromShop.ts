'use server';

import { itemRepository } from '@/data/item';
import { coinRepository } from '@/data/coins';
import { findStackItem } from '@/domain/item';
import { validateBuyFromShop, type IBuyFromShopInput, type IBuyFromShopResult } from '@/domain/shop';
import { getNpc } from '@/services/npc/crud/getNpc';
import { getPlayer } from '@/services/player/crud/getPlayer';

export const buyFromShop = async (input: IBuyFromShopInput): Promise<IBuyFromShopResult> => {
  validateBuyFromShop(input);

  const [npc, player] = await Promise.all([getNpc(input.npcId), getPlayer(input.playerId)]);

  if (player.campaignId !== npc.campaignId) throw new Error('Игрок и NPC принадлежат разным кампаниям.');
  if (input.campaignId && input.campaignId !== npc.campaignId)
    throw new Error('campaignId не соответствует кампании NPC.');
  if (!npc.shopSpecialtyKey) throw new Error('NPC не является торговцем.');

  const item = await itemRepository.getById(input.itemId);
  if (!item) throw new Error('Предмет не найден.');
  if (item.npcId !== npc.id) throw new Error('Предмет не принадлежит этому торговцу.');
  if (item.quantity < input.quantity) throw new Error('Недостаточно предметов в наличии.');
  if (!item.valueCp || item.valueCp <= 0) throw new Error('Предмет не имеет цены.');

  const totalPrice = item.valueCp * input.quantity;
  if (player.coinsCp < totalPrice) throw new Error('Недостаточно монет для покупки.');

  const coinResult = await coinRepository.transfer({
    from: { kind: 'player', id: player.id },
    to: { kind: 'npc', id: npc.id },
    amountCp: totalPrice,
  });

  const playerInventory = await itemRepository.listByPlayerId(player.id);
  const stackTarget = item.catalogKey ? findStackItem(playerInventory, item.catalogKey) : null;

  let updatedPlayerItem;
  if (stackTarget) {
    updatedPlayerItem = await itemRepository.update(stackTarget.id, {
      quantity: stackTarget.quantity + input.quantity,
    });
  } else {
    updatedPlayerItem = await itemRepository.create({
      campaignId: player.campaignId,
      name: item.name,
      kind: item.kind,
      rarity: item.rarity,
      description: item.description,
      weight: item.weight,
      valueCp: item.valueCp,
      quantity: input.quantity,
      catalogKey: item.catalogKey,
      isMagical: item.isMagical,
      properties: item.properties,
      equipSlot: item.equipSlot,
      playerId: player.id,
      locationId: null,
      npcId: null,
      coinsCp: 0,
    });
  }

  if (item.quantity === input.quantity) {
    await itemRepository.delete(item.id);
  } else {
    await itemRepository.update(item.id, {
      quantity: item.quantity - input.quantity,
    });
  }

  return {
    ok: true,
    item: {
      id: updatedPlayerItem.id,
      catalogKey: updatedPlayerItem.catalogKey,
      name: updatedPlayerItem.name,
      kind: updatedPlayerItem.kind,
      description: updatedPlayerItem.description,
      quantity: updatedPlayerItem.quantity,
      priceCp: updatedPlayerItem.valueCp ?? 0,
      rarity: updatedPlayerItem.rarity,
      isMagical: updatedPlayerItem.isMagical,
      properties: updatedPlayerItem.properties,
      weight: updatedPlayerItem.weight,
    },
    playerCoinsCp: coinResult.fromCoinsCp,
    npcCoinsCp: coinResult.toCoinsCp,
  };
};
