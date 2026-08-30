import type { WeaponMastery } from './catalog/mastery';
import type { EquipSlot, ItemKind, ItemRarity } from '@/domain/shared';

export type IItemProp =
  | { type: 'damage'; text: string; dice: string; damageType?: string }
  | { type: 'range'; text: string; normal: number; long?: number }
  | { type: 'ac'; text: string; base: number; addDex: boolean }
  | { type: 'heal'; text: string; dice: string }
  | { type: 'twoHanded'; text: string }
  | { type: 'stealthDisadvantage'; text: string }
  | { type: 'mastery'; text: string; mastery: WeaponMastery }
  | { type: 'note'; text: string };

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
  catalogKey: string | null;
  isMagical: boolean;
  properties: IItemProp[] | null;
  equipSlot: EquipSlot | null;
  playerId: string | null;
  npcId: string | null;
  locationId: string | null;
}

export type ICreateItem = Omit<IItem, 'id' | 'quantity' | 'isMagical' | 'coinsCp' | 'equipSlot' | 'catalogKey'> & {
  quantity?: number;
  isMagical?: boolean;
  coinsCp?: number;
  equipSlot?: EquipSlot | null;
  catalogKey?: string | null;
};

export type IUpdateItem = Partial<Omit<ICreateItem, 'campaignId'>>;

export interface IEquipItem {
  itemId: string;
  slot: EquipSlot;
}

export interface IUnequipItem {
  itemId: string;
}

export interface IGrantCatalogItem {
  playerId: string;
  key: string;
  quantity?: number;
}

export interface IEquipItemResult {
  item: IItem;
  unequipped: IItem[];
}

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
  properties: IItemProp[] | null;
  isMagical: boolean;
  equipSlot: EquipSlot | null;
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
