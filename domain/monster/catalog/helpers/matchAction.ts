import { normalizeText } from '@/domain/player/helpers/normalizeKey';
import type { IMonsterAction } from '../types';

const normalizeAttackName = (value: string) =>
  normalizeText(value)
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const tokensOf = (value: string) => normalizeAttackName(value).split(' ').filter(Boolean);

const uniqueHit = (hits: IMonsterAction[]): IMonsterAction | null => (hits.length === 1 ? hits[0] : null);

export const matchCatalogAction = (query: string, actions: IMonsterAction[]): IMonsterAction | null => {
  const q = normalizeAttackName(query);
  if (!q) return null;

  const exact = uniqueHit(actions.filter((a) => normalizeAttackName(a.name) === q));
  if (exact) return exact;

  const qTokens = tokensOf(q);
  const tokenHits = actions.filter((a) => {
    const nameTokens = tokensOf(a.name);
    return qTokens.every((token) => nameTokens.includes(token));
  });

  if (tokenHits.length === 1) return tokenHits[0];
  if (tokenHits.length > 1 && qTokens.length === 1) {
    const lastTokenHits = tokenHits.filter((a) => tokensOf(a.name).at(-1) === q);
    const last = uniqueHit(lastTokenHits);
    if (last) return last;
    return null;
  }
  if (tokenHits.length > 1) return null;

  if (q.length < 3) return null;

  const containsHits = actions.filter((a) => {
    const n = normalizeAttackName(a.name);
    if (n.includes(` ${q}`) || n.startsWith(`${q} `) || n.endsWith(` ${q}`)) return true;
    return q.includes(n) && n.length >= 3;
  });

  return uniqueHit(containsHits);
};
