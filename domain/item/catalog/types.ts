import type { ItemKind, ItemRarity } from '@/domain/shared';
import type { IItemProp } from '../types';

export interface IItemCatalogEntry {
  key: string;
  aliases: string[];
  name: string;
  kind: ItemKind;
  rarity: ItemRarity | null;
  description: string;
  weight: number | null;
  valueCp: number | null;
  isMagical: boolean;
  properties: IItemProp[] | null;
}

export interface ISearchItemCatalogResult {
  query: string | null;
  exact: boolean;
  items: IItemCatalogEntry[];
}
