import { LocationKind } from '@/domain/shared';
import data from './data/specialties.json';
import type { IShopSpecialty } from './types';

const validateEntry = (raw: unknown, index: number): IShopSpecialty => {
  if (!raw || typeof raw !== 'object') throw new Error(`specialties[${index}] не объект.`);
  const obj = raw as Record<string, unknown>;

  if (typeof obj.key !== 'string' || !obj.key.trim()) throw new Error(`specialties[${index}].key обязателен.`);
  if (typeof obj.name !== 'string' || !obj.name.trim()) throw new Error(`specialties[${index}].name обязателен.`);
  if (typeof obj.description !== 'string') throw new Error(`specialties[${index}].description обязателен.`);

  if (!Array.isArray(obj.preferredLocationKinds))
    throw new Error(`specialties[${index}].preferredLocationKinds должен быть массивом.`);
  const locationKinds = Object.values(LocationKind);
  obj.preferredLocationKinds.forEach((kind, i) => {
    if (!locationKinds.includes(kind as LocationKind))
      throw new Error(`specialties[${index}].preferredLocationKinds[${i}] не является LocationKind.`);
  });

  if (!Array.isArray(obj.catalogKeys)) throw new Error(`specialties[${index}].catalogKeys должен быть массивом.`);
  obj.catalogKeys.forEach((key, i) => {
    if (typeof key !== 'string' || !key.trim())
      throw new Error(`specialties[${index}].catalogKeys[${i}] должен быть непустой строкой.`);
  });

  return {
    key: obj.key.trim(),
    name: obj.name.trim(),
    description: obj.description.trim(),
    preferredLocationKinds: obj.preferredLocationKinds as LocationKind[],
    catalogKeys: obj.catalogKeys as string[],
  };
};

const assertUniqueKeys = (entries: IShopSpecialty[]) => {
  const keys = new Set<string>();
  entries.forEach((entry) => {
    if (keys.has(entry.key)) throw new Error(`Дублирующийся ключ специальности: ${entry.key}`);
    keys.add(entry.key);
  });
};

let catalog: IShopSpecialty[] | null = null;

export const loadSpecialtyCatalog = (): IShopSpecialty[] => {
  if (catalog) return catalog;
  if (!Array.isArray(data)) throw new Error('Файл специальностей должен быть массивом.');
  const entries = data.map((raw, i) => validateEntry(raw, i));
  assertUniqueKeys(entries);
  catalog = entries;
  return catalog;
};
