import { listItemsByLocation } from '@/services/item/crud/listItemsByLocation';
import { getCampaign } from '@/services/campaign/crud/getCampaign';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import { loadLocationContext, type ILocationContext } from '@/services/location/loadLocationContext';
import type { IPlayerTravelState } from '@/domain/player';
import type { TimeOfDay } from '@/domain/shared';
import { db } from '@/data/shared';

interface ILoadMasterContextParams {
  campaignId: string;
  playerId: string;
}

export interface IMasterContext {
  world: ILocationContext;
  player: {
    id: string;
    name: string;
    hpMax: number;
    hpCurrent: number;
    hpTemp: number;
    hitDie: string;
    hitDiceLeft: number;
    level: number;
    conditions: string[];
    exhaustionLevel: number;
    shortRestsToday: number;
  };
  itemsHere: Array<{
    id: string;
    name: string;
    kind: string;
    quantity: number;
    isMagical: boolean;
    rarity: string | null;
  }>;
  travel: IPlayerTravelState | null;
  clock: {
    dayIndex: number;
    timeOfDay: TimeOfDay;
  };
  npcs: Array<{ name: string; title: string | null; location: string | null; shopSpecialtyKey: string | null }>;
}

export const loadMasterContext = async ({
  campaignId,
  playerId,
}: ILoadMasterContextParams): Promise<IMasterContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const world = await loadLocationContext({ campaignId, playerId });
  const [player, itemsHere, loc, campaign, allNpcs, npcLocations] = await Promise.all([
    getPlayer(playerId),
    listItemsByLocation(world.playerHere.id),
    getPlayerLocation({ campaignId, playerId }),
    getCampaign(campaignId),
    db.npc.findMany({ where: { campaignId }, select: { id: true, name: true, title: true, shopSpecialtyKey: true } }),
    db.npcLocation.findMany({ where: { npc: { campaignId } }, select: { npcId: true, locationId: true, role: true } }),
  ]);

  if (player.campaignId !== campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const npcLocationMap = new Map(
    npcLocations.map((nl) => [nl.npcId, { locationId: nl.locationId, role: nl.role }])
  );

  const locations = await db.location.findMany({
    where: { id: { in: Array.from(new Set(npcLocations.map((nl) => nl.locationId))) } },
    select: { id: true, name: true },
  });
  const locationMap = new Map(locations.map((loc) => [loc.id, loc.name]));

  const npcs = allNpcs.map((npc) => {
    const nloc = npcLocationMap.get(npc.id);
    return {
      name: npc.name,
      title: npc.title,
      location: nloc ? locationMap.get(nloc.locationId) ?? null : null,
      shopSpecialtyKey: npc.shopSpecialtyKey,
    };
  });

  return {
    world,
    player: {
      id: player.id,
      name: player.name,
      hpMax: player.hpMax,
      hpCurrent: player.hpCurrent,
      hpTemp: player.hpTemp,
      hitDie: player.hitDie,
      hitDiceLeft: player.hitDiceLeft,
      level: player.level,
      conditions: player.conditions,
      exhaustionLevel: player.exhaustionLevel,
      shortRestsToday:
        player.shortRestDayIndex === campaign.dayIndex ? player.shortRestsToday : 0,
    },
    itemsHere: itemsHere.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      quantity: item.quantity,
      isMagical: item.isMagical,
      rarity: item.rarity,
    })),
    travel: loc.travel,
    clock: {
      dayIndex: campaign.dayIndex,
      timeOfDay: campaign.timeOfDay,
    },
    npcs,
  };
};
