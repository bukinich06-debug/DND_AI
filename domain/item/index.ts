export type { IItemCatalogEntry, ISearchItemCatalogResult } from './catalog';
export { catalogToCreateItem, getCatalogItemByKey, getWeaponMastery, searchItemCatalog, WeaponMastery } from './catalog';
export type {
  ICreateItem,
  IEquipItem,
  IEquipItemResult,
  IGrantCatalogItem,
  IItem,
  IItemProp,
  IItemRepository,
  ISearchPlayerItem,
  ISearchPlayerItems,
  ISearchPlayerItemsResult,
  IUnequipItem,
  IUpdateItem,
} from './types';
export type { IMatchItemsResult, IMatchedItem } from './helpers/matchItem';
export { matchItems } from './helpers/matchItem';
export { assertItemOwnership, validateCreateItem, validateUpdateItem } from './validation/validateItem';
export { validateGrantCatalogItem } from './validation/validateGrantCatalogItem';
export { validateSearchPlayerItems } from './validation/validateSearchPlayerItems';
export { assertEquipConflicts, assertEquipOnItem, occupantsToUnequip } from './validation/validateEquip';
export { validateEquipItem, validateUnequipItem } from './validation/validateEquipRequest';
export { parseItemProperties, validateItemProperties } from './validation/validateProperties';
