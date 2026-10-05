import { normalizeText } from '@/domain/player/helpers/normalizeKey';
import type { IMonsterAbility } from '../types';

const normalizeTraitName = (value: string) =>
  normalizeText(value)
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const CATALOG_TRAIT = {
  nimble: 'Юркий',
  aggressive: 'Агрессивный',
  packTactics: 'Тактика стаи',
  keenSenses: 'Острый слух и обоняние',
} as const;

export const hasCatalogTrait = (traits: IMonsterAbility[] | null | undefined, name: string): boolean => {
  const q = normalizeTraitName(name);
  if (!q) return false;
  return (traits ?? []).some((t) => normalizeTraitName(t.name) === q);
};
