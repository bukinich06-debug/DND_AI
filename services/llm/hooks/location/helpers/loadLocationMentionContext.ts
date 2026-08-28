import { LocationKind } from '@/domain/shared';
import { walkAncestors, type ILocation } from '@/domain/location';
import { listLocationLinksByCampaign } from '@/services/location-link/crud/listLocationLinksByCampaign';
import { loadMentionAnchor } from '@/services/location/helpers/loadMentionAnchor';

interface ILoadParams {
  campaignId: string;
  playerId: string;
  npcId?: string;
}

const compact = (loc: ILocation) => ({
  id: loc.id,
  name: loc.name,
  kind: loc.kind,
  parentId: loc.parentId,
  tags: loc.tags,
});

export const loadLocationMentionContext = async ({ campaignId, playerId, npcId }: ILoadParams) => {
  const { startId, locations, byId, anchor } = await loadMentionAnchor({ campaignId, playerId, npcId });
  const chain = startId ? walkAncestors(startId, byId).map(compact) : [];
  const here = anchor.settlementId
    ? locations.filter((loc) => loc.parentId === anchor.settlementId).map(compact)
    : [];
  const neighbors = anchor.settlementId
    ? locations
        .filter(
          (loc) =>
            loc.kind === LocationKind.settlement &&
            loc.id !== anchor.settlementId &&
            loc.parentId === anchor.settlementParentId
        )
        .map(compact)
    : [];

  const links = await listLocationLinksByCampaign(campaignId);
  const settlementId = anchor.settlementId;
  const roads = settlementId
    ? links
        .filter((link) => link.fromId === settlementId || link.toId === settlementId)
        .map((link) => ({
          id: link.id,
          fromId: link.fromId,
          toId: link.toId,
          fromName: byId.get(link.fromId)?.name ?? link.fromId,
          toName: byId.get(link.toId)?.name ?? link.toId,
          days: link.days,
          label: link.label,
        }))
    : [];

  return {
    chain,
    here,
    neighbors,
    roads,
    currentBuildingId: anchor.buildingId,
    currentSettlementId: anchor.settlementId,
  };
};
