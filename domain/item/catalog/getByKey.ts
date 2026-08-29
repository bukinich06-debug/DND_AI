import { loadCatalog } from './loadCatalog';
import type { IItemCatalogEntry } from './types';

export const getCatalogItemByKey = (key: string): IItemCatalogEntry => {
  const entry = loadCatalog().find((item) => item.key === key);
  if (!entry) throw new Error('Предмет справочника не найден.');
  return entry;
};
