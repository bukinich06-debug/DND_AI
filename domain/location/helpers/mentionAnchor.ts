import { LocationKind } from '@/domain/shared';
import { findInChain, walkAncestors } from './walkAncestors';

export interface IMentionAnchor {
  buildingId: string | null;
  settlementId: string | null;
  settlementParentId: string | null;
  regionParentId: string | null;
}

const emptyAnchor = (): IMentionAnchor => ({
  buildingId: null,
  settlementId: null,
  settlementParentId: null,
  regionParentId: null,
});

export const buildMentionAnchor = <T extends { id: string; parentId: string | null; kind: LocationKind }>(
  startId: string | null,
  byId: Map<string, T>
): IMentionAnchor => {
  if (!startId) return emptyAnchor();

  const chain = walkAncestors(startId, byId);
  const building = findInChain(chain, [LocationKind.building, LocationKind.dungeon]);
  const settlement = findInChain(chain, [LocationKind.settlement]);
  const region = findInChain(chain, [LocationKind.region]);

  return {
    buildingId: building?.id ?? null,
    settlementId: settlement?.id ?? null,
    settlementParentId: settlement?.parentId ?? null,
    regionParentId: region?.parentId ?? null,
  };
};

export const resolveMentionParentId = (
  kind: LocationKind,
  containerId: string | null | undefined,
  anchor: IMentionAnchor
): string | null => {
  if (containerId) return containerId;

  if (kind === LocationKind.room) return anchor.buildingId ?? anchor.settlementId;
  if (kind === LocationKind.building || kind === LocationKind.dungeon || kind === LocationKind.district)
    return anchor.settlementId;
  if (kind === LocationKind.region) return anchor.regionParentId;

  return anchor.settlementParentId;
};
