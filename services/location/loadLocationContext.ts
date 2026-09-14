import type { LocationKind, TimeOfDay } from '@/domain/shared';
import { getLocation } from '@/services/location/crud/getLocation';
import { listLocationChildren } from '@/services/location/crud/listLocationChildren';
import { listNpcsAtLocation } from '@/services/npc/crud/listNpcsAtLocation';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import { worldEventRepository } from '@/data/world-event';

interface ILoadLocationContextParams {
  campaignId: string;
  playerId: string;
  lookLocationId?: string;
}

export interface ILocationContext {
  player: {
    id: string;
    name: string;
  };
  playerHere: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
    kind: LocationKind;
    tags: string[];
    summary: string;
    description: string;
    features: string;
  };
  parent: {
    id: string;
    name: string;
    kind: LocationKind;
    summary: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    kind: LocationKind;
    tags: string[];
    summary: string;
  }>;
  npcsHere: Array<{
    id: string;
    name: string;
    title: string | null;
    appearance: string;
    habits: string;
    role: string | null;
    shopSpecialtyKey: string | null;
  }>;
  meetings: Array<{
    title: string;
    slot: TimeOfDay;
    locationId: string;
    npcId: string | null;
    here: boolean;
  }>;
}

export const loadLocationContext = async ({
  campaignId,
  playerId,
  lookLocationId,
}: ILoadLocationContextParams): Promise<ILocationContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const [playerLoc, player] = await Promise.all([getPlayerLocation({ campaignId, playerId }), getPlayer(playerId)]);

  const here = playerLoc.location;
  if (!here) throw new Error('У игрока нет текущей локации.');
  if (here.campaignId !== campaignId) throw new Error('Локация не принадлежит этой кампании.');

  const lookId = lookLocationId?.trim() || '';
  const location = lookId && lookId !== here.id ? await getLocation(lookId) : here;
  if (location.campaignId !== campaignId) throw new Error('Локация не принадлежит этой кампании.');

  const [parent, children, npcs, pending] = await Promise.all([
    location.parentId ? getLocation(location.parentId) : Promise.resolve(null),
    listLocationChildren(location.id),
    listNpcsAtLocation(location.id),
    worldEventRepository.listPendingByPlayer(campaignId, playerId),
  ]);

  const seen = new Set<string>();
  const npcsHere: ILocationContext['npcsHere'] = [];
  for (const { npc, role } of npcs) {
    if (seen.has(npc.id)) continue;
    seen.add(npc.id);
    npcsHere.push({
      id: npc.id,
      name: npc.name,
      title: npc.title,
      appearance: npc.appearance,
      habits: npc.habits,
      role,
      shopSpecialtyKey: npc.shopSpecialtyKey,
    });
  }

  return {
    player: { id: player.id, name: player.name },
    playerHere: { id: here.id, name: here.name },
    location: {
      id: location.id,
      name: location.name,
      kind: location.kind,
      tags: location.tags,
      summary: location.summary,
      description: location.description,
      features: location.features,
    },
    parent: parent ? { id: parent.id, name: parent.name, kind: parent.kind, summary: parent.summary } : null,
    children: children
      .filter((child) => !child.isSecret)
      .map((child) => ({
        id: child.id,
        name: child.name,
        kind: child.kind,
        tags: child.tags,
        summary: child.summary,
      })),
    npcsHere,
    meetings: pending.map((e) => ({
      title: e.title,
      slot: e.slot,
      locationId: e.locationId,
      npcId: e.npcId,
      here: e.locationId === here.id,
    })),
  };
};
