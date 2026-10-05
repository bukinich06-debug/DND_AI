import type { IMonsterAbility } from '../types';
import { CATALOG_TRAIT, hasCatalogTrait } from './matchTrait';

export type TMonsterBonusKind = 'disengage' | 'hide' | 'aggressive';

export const bonusKindsFromTraits = (traits: IMonsterAbility[] | null | undefined): TMonsterBonusKind[] => {
  const kinds: TMonsterBonusKind[] = [];
  if (hasCatalogTrait(traits, CATALOG_TRAIT.nimble)) {
    kinds.push('disengage', 'hide');
  }
  if (hasCatalogTrait(traits, CATALOG_TRAIT.aggressive)) kinds.push('aggressive');
  return kinds;
};

export const bonusKindAllowed = (traits: IMonsterAbility[] | null | undefined, kind: TMonsterBonusKind): boolean =>
  bonusKindsFromTraits(traits).includes(kind);
