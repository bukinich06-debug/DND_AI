'use server';

import { itemRepository } from '@/data/item';
import { playerRepository } from '@/data/player';
import { validateTakeItem, type IItem, type ITakeItem } from '@/domain/item';

export const takeItem = async (input: ITakeItem): Promise<IItem> => {
  validateTakeItem(input);

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (!player.locationId) throw new Error('У игрока нет текущей локации.');

  const item = await itemRepository.getById(input.itemId);
  if (!item) throw new Error('Предмет не найден.');
  if (item.campaignId !== player.campaignId) throw new Error('Предмет из другой кампании.');
  if (!item.locationId || item.playerId || item.npcId) throw new Error('Предмет не лежит в локации.');
  if (item.locationId !== player.locationId) throw new Error('Предмет не здесь.');

  return itemRepository.update(item.id, {
    playerId: player.id,
    npcId: null,
    locationId: null,
    equipSlot: null,
  });
};
