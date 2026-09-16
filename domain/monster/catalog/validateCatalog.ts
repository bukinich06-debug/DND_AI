import type { IMonsterCatalogEntry } from './types';

export const validateCatalogFile = (data: unknown): IMonsterCatalogEntry[] => {
  if (!Array.isArray(data)) throw new Error('Каталог монстров должен быть массивом.');

  return data.map((entry, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`Запись ${index} должна быть объектом.`);
    
    const e = entry as Record<string, unknown>;
    if (typeof e.key !== 'string' || !e.key.trim()) throw new Error(`Запись ${index}: key обязателен.`);
    if (typeof e.name !== 'string' || !e.name.trim()) throw new Error(`Запись ${index}: name обязательно.`);

    return entry as IMonsterCatalogEntry;
  });
};

export const assertUniqueKeys = (entries: IMonsterCatalogEntry[]) => {
  const keys = entries.map((e) => e.key);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length > 0) throw new Error(`Дублированные ключи монстров: ${duplicates.join(', ')}`);
};
