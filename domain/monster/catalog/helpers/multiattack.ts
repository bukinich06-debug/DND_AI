import type { IMonsterAction, IMultiattackPart } from '../types';
import { matchCatalogAction } from './matchAction';

const normalizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, ' ');

export const isMultiattackName = (name: string): boolean => {
  const n = normalizeName(name);
  return n === 'мультиатака' || n === 'multiattack';
};

export const isMultiattackAction = (action: IMonsterAction): boolean =>
  (action.multiattack != null && action.multiattack.length > 0) || isMultiattackName(action.name);

const strikeActionsOf = (actions: IMonsterAction[]): IMonsterAction[] => actions.filter((a) => !isMultiattackAction(a));

export const expandMultiattack = (action: IMonsterAction, actions: IMonsterAction[]): IMonsterAction[] => {
  const parts: IMultiattackPart[] = action.multiattack ?? [];
  const strikes = strikeActionsOf(actions);
  const result: IMonsterAction[] = [];

  for (const part of parts) {
    const resolved = matchCatalogAction(part.attack, strikes);
    if (!resolved) continue;
    const count = part.count ?? 1;
    for (let i = 0; i < count; i += 1) result.push(resolved);
  }

  return result;
};
