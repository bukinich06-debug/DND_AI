import { locationRepository } from '@/data/location';
import { npcLocationRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { buildMentionAnchor, type ILocation, type IMentionAnchor } from '@/domain/location';

interface ILoadMentionAnchorParams {
  campaignId: string;
  playerId?: string;
  npcId?: string;
}

interface ILoadedMentionAnchor {
  startId: string | null;
  locations: ILocation[];
  byId: Map<string, ILocation>;
  anchor: IMentionAnchor;
}

export const loadMentionAnchor = async ({
  campaignId,
  playerId,
  npcId,
}: ILoadMentionAnchorParams): Promise<ILoadedMentionAnchor> => {
  const locations = await locationRepository.listByCampaignId(campaignId);
  const byId = new Map(locations.map((loc) => [loc.id, loc]));

  let startId: string | null = null;
  if (playerId?.trim()) {
    const player = await playerRepository.getById(playerId.trim());
    if (player?.locationId && byId.has(player.locationId)) startId = player.locationId;
  }
  if (!startId && npcId?.trim()) {
    const links = await npcLocationRepository.listByNpcId(npcId.trim());
    const primary = links.find((link) => link.isPrimary) ?? links[0];
    if (primary && byId.has(primary.locationId)) startId = primary.locationId;
  }

  return { startId, locations, byId, anchor: buildMentionAnchor(startId, byId) };
};
