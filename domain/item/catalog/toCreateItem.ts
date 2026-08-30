import type { ICreateItem } from '../types';
import type { IItemCatalogEntry } from './types';

interface ICatalogToCreate {
  entry: IItemCatalogEntry;
  campaignId: string;
  playerId: string;
  quantity: number;
}

export const catalogToCreateItem = ({ entry, campaignId, playerId, quantity }: ICatalogToCreate): ICreateItem => ({
  campaignId,
  name: entry.name,
  kind: entry.kind,
  rarity: entry.rarity,
  description: entry.description,
  weight: entry.weight,
  valueCp: entry.valueCp,
  isMagical: entry.isMagical,
  properties: entry.properties,
  quantity,
  catalogKey: entry.key,
  playerId,
  npcId: null,
  locationId: null,
  equipSlot: null,
});
