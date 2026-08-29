import { normalizeText, textIncludes } from '@/domain/player/helpers/normalizeKey';
import { loadCatalog } from './loadCatalog';
import type { IItemCatalogEntry, ISearchItemCatalogResult } from './types';

const scoreAgainstQuery = (entry: IItemCatalogEntry, query: string): number => {
  const q = normalizeText(query);
  if (!q) return 0;

  const key = normalizeText(entry.key.replace(/([A-Z])/g, ' $1'));
  if (key === q) return 100;

  let best = 0;
  for (const alias of entry.aliases) {
    const a = normalizeText(alias);
    if (a === q) best = Math.max(best, 100);
    else if (a.includes(q) || q.includes(a)) best = Math.max(best, 80);
  }

  const name = normalizeText(entry.name);
  if (name === q) best = Math.max(best, 90);
  else if (name.includes(q)) best = Math.max(best, 70);
  else if (q.includes(name) && name.length >= 3) best = Math.max(best, 60);
  else if (textIncludes(entry.description, q)) best = Math.max(best, 40);

  return best;
};

export const searchItemCatalog = (query?: string | null): ISearchItemCatalogResult => {
  const items = loadCatalog();
  const trimmed = query?.trim() ?? '';
  if (!trimmed)
    return {
      query: null,
      exact: false,
      items,
    };

  const scored = items
    .map((item) => ({ item, score: scoreAgainstQuery(item, trimmed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'ru'));

  const exact = scored.length === 1 && scored[0].score >= 80;

  return {
    query: trimmed,
    exact,
    items: scored.map((row) => row.item),
  };
};
