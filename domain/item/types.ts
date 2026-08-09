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
  quantity: number;
  isMagical: boolean;
  properties: unknown;
  playerId: string | null;
  npcId: string | null;
  locationId: string | null;
}

export type ICreateItem = Omit<IItem, 'id' | 'quantity' | 'isMagical'> & {
  quantity?: number;
  isMagical?: boolean;
};

export type IUpdateItem = Partial<Omit<ICreateItem, 'campaignId'>>;

export interface IItemRepository {
  create: (input: ICreateItem) => Promise<IItem>;
  getById: (id: string) => Promise<IItem | null>;
  listByCampaignId: (campaignId: string) => Promise<IItem[]>;
  update: (id: string, input: IUpdateItem) => Promise<IItem>;
  delete: (id: string) => Promise<void>;
}
