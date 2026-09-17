import type { ICreateItem } from '../types';
import type { IItemCatalogEntry } from './types';

interface ICatalogToCreate {
  entry: IItemCatalogEntry;
  campaignId: string;
  playerId?: string;
  npcId?: string;
  locationId?: string;
  quantity?: number;
}

export const catalogToCreateItem = ({
  entry,
  campaignId,
  playerId,
  npcId,
  locationId,
  quantity,
}: ICatalogToCreate): ICreateItem => ({
  campaignId,
  name: entry.name,
  kind: entry.kind,
  rarity: entry.rarity,
  description: entry.description,
  weight: entry.weight,
  valueCp: entry.valueCp,
  isMagical: entry.isMagical,
  properties: entry.properties,
  quantity: quantity ?? 1,
  catalogKey: entry.key,
  playerId: playerId ?? null,
  npcId: npcId ?? null,
  locationId: locationId ?? null,
  equipSlot: null,
});
