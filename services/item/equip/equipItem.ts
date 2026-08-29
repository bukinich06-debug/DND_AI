'use server';

import { itemRepository } from '@/data/item';
import {
  assertEquipOnItem,
  occupantsToUnequip,
  validateEquipItem,
  type IEquipItem,
  type IEquipItemResult,
} from '@/domain/item';

export const equipItem = async (input: IEquipItem): Promise<IEquipItemResult> => {
  validateEquipItem(input);
  const item = await itemRepository.getById(input.itemId.trim());
  if (!item) throw new Error('Предмет не найден.');
  if (!item.playerId) throw new Error('Экипировать можно только предмет игрока.');

  assertEquipOnItem({
    kind: item.kind,
    quantity: item.quantity,
    playerId: item.playerId,
    equipSlot: input.slot,
    properties: item.properties,
  });

  const inventory = await itemRepository.listByPlayerId(item.playerId);
  const occupants = occupantsToUnequip(
    { id: item.id, equipSlot: input.slot, properties: item.properties },
    inventory
  );

  const unequipped = [];
  for (const occupant of occupants) {
    unequipped.push(await itemRepository.update(occupant.id, { equipSlot: null }));
  }

  const equipped = await itemRepository.update(item.id, { equipSlot: input.slot });
  return { item: equipped, unequipped };
};
