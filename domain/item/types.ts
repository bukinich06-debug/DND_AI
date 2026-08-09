import type { ItemKind, ItemRarity } from '@/domain/shared';

export interface IItem {
  id: string;
  campaignId: string;
  name: string;
  kind: ItemKind;
  rarity: ItemRarity | null;
  description: string;
  weight: number | null;
  valueCp: number | null;
  coinsCp: number;
  quantity: number;
  isMagical: boolean;
  properties: unknown;
  playerId: string | null;
  npcId: string | null;
  locationId: string | null;
}

export type ICreateItem = Omit<IItem, 'id' | 'quantity' | 'isMagical' | 'coinsCp'> & {
  quantity?: number;
  isMagical?: boolean;
  coinsCp?: number;
};

export type IUpdateItem = Partial<Omit<ICreateItem, 'campaignId'>>;

export interface ISearchPlayerItems {
  campaignId: string;
  playerId: string;
  query?: string | null;
}

export interface ISearchPlayerItem {
  id: string;
  name: string;
  kind: ItemKind;
  quantity: number;
  description: string;
  properties: unknown;
  isMagical: boolean;
  toolKey?: string | null;
}

export interface ISearchPlayerItemsResult {
  playerId: string;
  query: string | null;
  exact: boolean;
  items: ISearchPlayerItem[];
}

export interface IItemRepository {
  create: (input: ICreateItem) => Promise<IItem>;
  getById: (id: string) => Promise<IItem | null>;
  listByCampaignId: (campaignId: string) => Promise<IItem[]>;
  listByPlayerId: (playerId: string) => Promise<IItem[]>;
  update: (id: string, input: IUpdateItem) => Promise<IItem>;
  delete: (id: string) => Promise<void>;
}
