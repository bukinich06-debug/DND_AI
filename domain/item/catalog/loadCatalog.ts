import { ItemKind } from '@/domain/shared';
import armor from './data/armor.json';
import consumable from './data/consumable.json';
import gear from './data/gear.json';
import shield from './data/shield.json';
import tool from './data/tool.json';
import weapon from './data/weapon.json';
import type { IItemCatalogEntry } from './types';
import { assertUniqueKeys, validateCatalogFile } from './validateCatalog';

let catalog: IItemCatalogEntry[] | null = null;

export const loadCatalog = (): IItemCatalogEntry[] => {
  if (catalog) return catalog;

  const entries = [
    ...validateCatalogFile(weapon, ItemKind.weapon),
    ...validateCatalogFile(armor, ItemKind.armor),
    ...validateCatalogFile(shield, ItemKind.shield),
    ...validateCatalogFile(consumable, ItemKind.consumable),
    ...validateCatalogFile(gear, ItemKind.gear),
    ...validateCatalogFile(tool, ItemKind.tool),
  ];
  assertUniqueKeys(entries);
  catalog = entries;
  return catalog;
};
