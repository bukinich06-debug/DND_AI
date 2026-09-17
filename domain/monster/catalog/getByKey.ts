import { loadCatalog } from './loadCatalog';
import type { IMonsterCatalogEntry } from './types';

export const getCatalogMonsterByKey = (key: string): IMonsterCatalogEntry => {
  const entry = loadCatalog().find((monster) => monster.key === key);
  if (!entry) throw new Error('Монстр справочника не найден.');
  return entry;
};
