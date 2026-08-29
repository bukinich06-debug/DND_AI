'use server';

import { itemRepository } from '@/data/item';
import { locationRepository } from '@/data/location';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import {
  assertEquipConflicts,
  assertEquipOnItem,
  assertItemOwnership,
  validateUpdateItem,
  type IUpdateItem,
} from '@/domain/item';

export const updateItem = async (id: string, input: IUpdateItem) => {
  validateUpdateItem(input);
  const existing = await itemRepository.getById(id);
  if (!existing) throw new Error('Предмет не найден.');

  const nextOwner = {
    playerId: input.playerId !== undefined ? input.playerId : existing.playerId,
    npcId: input.npcId !== undefined ? input.npcId : existing.npcId,
    locationId: input.locationId !== undefined ? input.locationId : existing.locationId,
  };
  assertItemOwnership(nextOwner);

  if (nextOwner.playerId) {
    const player = await playerRepository.getById(nextOwner.playerId);
    if (!player) throw new Error('Игрок не найден.');
    if (player.campaignId !== existing.campaignId) throw new Error('Игрок из другой кампании.');
  }
  if (nextOwner.npcId) {
    const npc = await npcRepository.getById(nextOwner.npcId);
    if (!npc) throw new Error('NPC не найден.');
    if (npc.campaignId !== existing.campaignId) throw new Error('NPC из другой кампании.');
  }
  if (nextOwner.locationId) {
    const location = await locationRepository.getById(nextOwner.locationId);
    if (!location) throw new Error('Локация не найдена.');
    if (location.campaignId !== existing.campaignId) throw new Error('Локация из другой кампании.');
  }

  const playerId = nextOwner.playerId || null;
  const equipSlot = playerId ? (input.equipSlot !== undefined ? input.equipSlot : existing.equipSlot) : null;
  const properties = input.properties !== undefined ? input.properties : existing.properties;
  assertEquipOnItem({
    kind: input.kind ?? existing.kind,
    quantity: input.quantity ?? existing.quantity,
    playerId,
    equipSlot,
    properties,
  });
  if (equipSlot && playerId) {
    const inventory = await itemRepository.listByPlayerId(playerId);
    assertEquipConflicts({ id, equipSlot, properties }, inventory);
  }

  return itemRepository.update(id, { ...input, equipSlot });
};
