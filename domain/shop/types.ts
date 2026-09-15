import type { ItemKind, ItemRarity } from '@/domain/shared';
import type { IItemProp } from '@/domain/item';

export interface IShopItem {
  id: string;
  catalogKey: string | null;
  name: string;
  kind: ItemKind;
  description: string;
  quantity: number;
  priceCp: number;
  rarity: ItemRarity | null;
  isMagical: boolean;
  properties: IItemProp[] | null;
  weight: number | null;
}

export interface IShopData {
  npcId: string;
  npcName: string;
  specialtyKey: string;
  specialtyName: string;
  playerCoinsCp: number;
  items: IShopItem[];
}

export interface IBuyFromShopInput {
  campaignId?: string;
  playerId: string;
  npcId: string;
  itemId: string;
  quantity: number;
}

export interface IBuyFromShopResult {
  ok: boolean;
  item: IShopItem;
  playerCoinsCp: number;
  npcCoinsCp: number;
}
