import { LocationKind } from '@/domain/shared';
import { findInChain, walkAncestors } from './walkAncestors';

export const settlementOf = <T extends { id: string; parentId: string | null; kind: LocationKind }>(
  startId: string,
  byId: Map<string, T>
): T | null => findInChain(walkAncestors(startId, byId), [LocationKind.settlement]);
