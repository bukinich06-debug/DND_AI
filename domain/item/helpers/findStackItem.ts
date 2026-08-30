import type { IItem } from '../types';

export const findStackItem = (items: IItem[], catalogKey: string): IItem | null => {
  const key = catalogKey.trim();
  return items.find((item) => item.catalogKey === key && item.equipSlot == null) ?? null;
};
