import type { LocationKind } from '@/domain/shared';
import { getLocation } from '@/services/location/crud/getLocation';
import { listLocationChildren } from '@/services/location/crud/listLocationChildren';
import { listNpcsAtLocation } from '@/services/npc/crud/listNpcsAtLocation';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';

interface ILoadWorldContextParams {
  campaignId: string;
  playerId: string;
}

export interface IWorldContext {
  player: {
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
  }>;
}

export const loadWorldContext = async ({ campaignId, playerId }: ILoadWorldContextParams): Promise<IWorldContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const [playerLoc, player] = await Promise.all([getPlayerLocation({ campaignId, playerId }), getPlayer(playerId)]);

  const location = playerLoc.location;
  if (!location) throw new Error('У игрока нет текущей локации.');
  if (location.campaignId !== campaignId) throw new Error('Локация не принадлежит этой кампании.');

  const [parent, children, npcs] = await Promise.all([
    location.parentId ? getLocation(location.parentId) : Promise.resolve(null),
    listLocationChildren(location.id),
    listNpcsAtLocation(location.id),
  ]);

  const seen = new Set<string>();
  const npcsHere: IWorldContext['npcsHere'] = [];
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
    });
  }

  return {
    player: { id: player.id, name: player.name },
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
  };
};
