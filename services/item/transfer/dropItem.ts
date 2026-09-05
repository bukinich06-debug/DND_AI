'use server';

import { itemRepository } from '@/data/item';
import { playerRepository } from '@/data/player';
import { validateDropItem, type IDropItem, type IItem } from '@/domain/item';

export const dropItem = async (input: IDropItem): Promise<IItem> => {
  validateDropItem(input);

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (!player.locationId) throw new Error('У игрока нет текущей локации.');

  const item = await itemRepository.getById(input.itemId);
  if (!item) throw new Error('Предмет не найден.');
  if (item.campaignId !== player.campaignId) throw new Error('Предмет из другой кампании.');
  if (item.playerId !== player.id) throw new Error('Предмет не у этого игрока.');

  return itemRepository.update(item.id, {
    playerId: null,
    npcId: null,
    locationId: player.locationId,
    equipSlot: null,
  });
};
