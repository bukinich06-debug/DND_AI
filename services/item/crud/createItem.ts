'use server';

import { campaignRepository } from '@/data/campaign';
import { itemRepository } from '@/data/item';
import { locationRepository } from '@/data/location';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { assertEquipConflicts, validateCreateItem, type ICreateItem } from '@/domain/item';

const assertOwnerInCampaign = async (input: ICreateItem) => {
  if (input.playerId) {
    const player = await playerRepository.getById(input.playerId);
    if (!player) throw new Error('Игрок не найден.');
    if (player.campaignId !== input.campaignId) throw new Error('Игрок из другой кампании.');
  }
  if (input.npcId) {
    const npc = await npcRepository.getById(input.npcId);
    if (!npc) throw new Error('NPC не найден.');
    if (npc.campaignId !== input.campaignId) throw new Error('NPC из другой кампании.');
  }
  if (input.locationId) {
    const location = await locationRepository.getById(input.locationId);
    if (!location) throw new Error('Локация не найдена.');
    if (location.campaignId !== input.campaignId) throw new Error('Локация из другой кампании.');
  }
};

export const createItem = async (input: ICreateItem) => {
  validateCreateItem(input);
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');
  await assertOwnerInCampaign(input);
  const equipSlot = input.playerId ? (input.equipSlot ?? null) : null;
  if (equipSlot && input.playerId) {
    const inventory = await itemRepository.listByPlayerId(input.playerId);
    assertEquipConflicts({ equipSlot, properties: input.properties }, inventory);
  }
  return itemRepository.create({ ...input, equipSlot });
};
