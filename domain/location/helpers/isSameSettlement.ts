import type { LocationKind } from '@/domain/shared';
import { settlementOf } from './settlementOf';

export const isSameSettlement = <T extends { id: string; parentId: string | null; kind: LocationKind }>(
  aId: string,
  bId: string,
  byId: Map<string, T>
) => {
  const a = settlementOf(aId, byId);
  const b = settlementOf(bId, byId);
  if (!a || !b) return false;
  return a.id === b.id;
};
