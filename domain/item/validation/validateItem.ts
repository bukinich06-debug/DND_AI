import { ItemKind, ItemRarity } from '@/domain/shared';
import type { ICreateItem, IUpdateItem } from '../types';
import { assertEquipOnItem } from './validateEquip';

const kinds = new Set<string>(Object.values(ItemKind));
const rarities = new Set<string>(Object.values(ItemRarity));

export const assertItemOwnership = (owner: {
  playerId?: string | null;
  npcId?: string | null;
  locationId?: string | null;
}) => {
  const count = [owner.playerId, owner.npcId, owner.locationId].filter((id) => id != null && id !== '').length;
  if (count > 1) throw new Error('У предмета может быть только один владелец.');
};

const validateCore = (input: Partial<ICreateItem>) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Название предмета обязательно.');
  if (input.description !== undefined && !input.description.trim()) throw new Error('Описание предмета обязательно.');
  if (input.kind !== undefined && !kinds.has(input.kind)) throw new Error('Неизвестная категория предмета.');
  if (input.rarity !== undefined && input.rarity !== null && !rarities.has(input.rarity))
    throw new Error('Неизвестная редкость предмета.');
  if (input.quantity !== undefined && input.quantity < 1) throw new Error('Количество должно быть не меньше 1.');
  if (input.weight !== undefined && input.weight !== null && input.weight < 0)
    throw new Error('Вес не может быть отрицательным.');
  if (input.valueCp !== undefined && input.valueCp !== null && input.valueCp < 0)
    throw new Error('Стоимость не может быть отрицательной.');
  if (input.coinsCp !== undefined && input.coinsCp < 0) throw new Error('Монеты не могут быть отрицательными.');
};

export const validateCreateItem = (input: ICreateItem) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.name.trim()) throw new Error('Название предмета обязательно.');
  if (!input.description.trim()) throw new Error('Описание предмета обязательно.');
  if (!kinds.has(input.kind)) throw new Error('Неизвестная категория предмета.');
  if (input.rarity != null && !rarities.has(input.rarity)) throw new Error('Неизвестная редкость предмета.');
  if (input.quantity !== undefined && input.quantity < 1) throw new Error('Количество должно быть не меньше 1.');
  if (input.coinsCp !== undefined && input.coinsCp < 0) throw new Error('Монеты не могут быть отрицательными.');
  assertItemOwnership(input);
  assertEquipOnItem({
    kind: input.kind,
    quantity: input.quantity ?? 1,
    playerId: input.playerId ?? null,
    equipSlot: input.equipSlot ?? null,
    properties: input.properties,
  });
};

export const validateUpdateItem = (input: IUpdateItem) => {
  validateCore(input);
  if (input.playerId !== undefined || input.npcId !== undefined || input.locationId !== undefined)
    assertItemOwnership(input);
};
