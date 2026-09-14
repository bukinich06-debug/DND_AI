import { db } from '@/data/shared';
import {
  parseCatalogKey,
  parseItemProperties,
  type ICreateItem,
  type IItem,
  type IItemRepository,
  type IUpdateItem,
} from '@/domain/item';
import type { EquipSlot, ItemKind, ItemRarity } from '@/domain/shared';
import type { Item } from '@/generated/client';

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
  catalogKey: row.catalogKey,
  isMagical: row.isMagical,
  properties: parseItemProperties(row.properties),
  equipSlot: row.equipSlot as EquipSlot | null,
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
        catalogKey: parseCatalogKey(input.catalogKey),
        isMagical: input.isMagical ?? false,
        properties: input.properties ?? undefined,
        equipSlot: input.playerId ? (input.equipSlot ?? null) : null,
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

  listByPlayerId: async (playerId) => {
    const rows = await db.item.findMany({ where: { playerId }, orderBy: { name: 'asc' } });
    return rows.map(mapItem);
  },

  listByLocationId: async (locationId) => {
    const rows = await db.item.findMany({ where: { locationId }, orderBy: { name: 'asc' } });
    return rows.map(mapItem);
  },

  listByOwnerId: async (owner) => {
    if (owner.kind === 'player') {
      const rows = await db.item.findMany({ where: { playerId: owner.id }, orderBy: { name: 'asc' } });
      return rows.map(mapItem);
    } else {
      const rows = await db.item.findMany({ where: { npcId: owner.id }, orderBy: { name: 'asc' } });
      return rows.map(mapItem);
    }
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
        ...(input.catalogKey !== undefined ? { catalogKey: parseCatalogKey(input.catalogKey) } : {}),
        ...(input.isMagical !== undefined ? { isMagical: input.isMagical } : {}),
        ...(input.properties !== undefined ? { properties: input.properties ?? undefined } : {}),
        ...(input.equipSlot !== undefined ? { equipSlot: input.equipSlot } : {}),
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
