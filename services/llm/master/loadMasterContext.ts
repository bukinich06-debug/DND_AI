import { listItemsByLocation } from '@/services/item/crud/listItemsByLocation';
import { getCampaign } from '@/services/campaign/crud/getCampaign';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import { loadLocationContext, type ILocationContext } from '@/services/location/loadLocationContext';
import type { IPlayerTravelState } from '@/domain/player';
import type { TimeOfDay } from '@/domain/shared';

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
}

export const loadMasterContext = async ({
  campaignId,
  playerId,
}: ILoadMasterContextParams): Promise<IMasterContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const world = await loadLocationContext({ campaignId, playerId });
  const [player, itemsHere, loc, campaign] = await Promise.all([
    getPlayer(playerId),
    listItemsByLocation(world.playerHere.id),
    getPlayerLocation({ campaignId, playerId }),
    getCampaign(campaignId),
  ]);

  if (player.campaignId !== campaignId) throw new Error('Игрок не принадлежит этой кампании.');

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
  };
};
