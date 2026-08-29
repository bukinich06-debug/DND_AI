import { EquipSlot } from '@/domain/shared';
import type { IEquipItem, IUnequipItem } from '../types';

const slots = new Set<string>(Object.values(EquipSlot));

export const validateEquipItem = (input: IEquipItem) => {
  if (!input.itemId?.trim()) throw new Error('id предмета обязателен.');
  if (!slots.has(input.slot)) throw new Error('Неизвестный слот экипировки.');
};

export const validateUnequipItem = (input: IUnequipItem) => {
  if (!input.itemId?.trim()) throw new Error('id предмета обязателен.');
};