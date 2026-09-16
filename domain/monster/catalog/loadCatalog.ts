import monsters from './data/monsters.json';
import type { IMonsterCatalogEntry } from './types';
import { assertUniqueKeys, validateCatalogFile } from './validateCatalog';

let catalog: IMonsterCatalogEntry[] | null = null;

export const loadCatalog = (): IMonsterCatalogEntry[] => {
  if (catalog) return catalog;

  const entries = validateCatalogFile(monsters);
  assertUniqueKeys(entries);
  catalog = entries;
  return catalog;
};
