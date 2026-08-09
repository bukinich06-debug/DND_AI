import type { Item } from '@/generated/client';
import type { ICreateItem, IItem, IItemRepository, IUpdateItem } from '@/domain/item';
import type { ItemKind, ItemRarity } from '@/domain/shared';
import { db } from '@/data/shared';

const mapItem = (row: Item): IItem => ({
  id: row.id,
  campaignId: row.campaignId,
  name: row.name,
  kind: row.kind as ItemKind,
  rarity: row.rarity as ItemRarity | null,
  description: row.description,
  weight: row.weight,
  valueCp: row.valueCp,
  coinsCp: row.coinsCp,
  quantity: row.quantity,
  isMagical: row.isMagical,
  properties: row.properties,
  playerId: row.playerId,
  npcId: row.npcId,
  locationId: row.locationId,
});

export const itemRepository: IItemRepository = {
  create: async (input: ICreateItem) => {
    const row = await db.item.create({
      data: {
        campaignId: input.campaignId,
        name: input.name.trim(),
        kind: input.kind,
        rarity: input.rarity ?? null,
        description: input.description.trim(),
        weight: input.weight ?? null,
        valueCp: input.valueCp ?? null,
        coinsCp: input.coinsCp ?? 0,
        quantity: input.quantity ?? 1,
        isMagical: input.isMagical ?? false,
        properties: input.properties ?? undefined,
        playerId: input.playerId ?? null,
        npcId: input.npcId ?? null,
        locationId: input.locationId ?? null,
      },
    });
    return mapItem(row);
  },

  getById: async (id) => {
    const row = await db.item.findUnique({ where: { id } });
    if (!row) return null;
    return mapItem(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.item.findMany({ where: { campaignId }, orderBy: { name: 'asc' } });
    return rows.map(mapItem);
  },

  update: async (id, input: IUpdateItem) => {
    const row = await db.item.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        ...(input.rarity !== undefined ? { rarity: input.rarity } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.valueCp !== undefined ? { valueCp: input.valueCp } : {}),
        ...(input.coinsCp !== undefined ? { coinsCp: input.coinsCp } : {}),
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.isMagical !== undefined ? { isMagical: input.isMagical } : {}),
        ...(input.properties !== undefined ? { properties: input.properties ?? undefined } : {}),
        ...(input.playerId !== undefined ? { playerId: input.playerId } : {}),
        ...(input.npcId !== undefined ? { npcId: input.npcId } : {}),
        ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
      },
    });
    return mapItem(row);
  },

  delete: async (id) => {
    await db.item.delete({ where: { id } });
  },
};
