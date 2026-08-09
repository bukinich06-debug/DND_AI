import { locationRepository } from '@/data/location';
import type { IPlayer, IPlayerLocation, IPlayerTravelState } from '@/domain/player';

export const buildPlayerLocation = async (player: IPlayer): Promise<IPlayerLocation> => {
  const location = player.locationId ? await locationRepository.getById(player.locationId) : null;

  let travel: IPlayerTravelState | null = null;
  if (
    player.travelDestinationId &&
    player.travelRoute &&
    player.travelLegIndex != null &&
    player.travelDaysLeft != null
  ) {
    const destination = await locationRepository.getById(player.travelDestinationId);
    if (destination) {
      travel = {
        destinationId: player.travelDestinationId,
        destination,
        route: player.travelRoute,
        legIndex: player.travelLegIndex,
        daysLeft: player.travelDaysLeft,
      };
    }
  }

  return {
    playerId: player.id,
    location,
    travel,
  };
};

export const clearTravelState = {
  travelDestinationId: null,
  travelRoute: null,
  travelLegIndex: null,
  travelDaysLeft: null,
} as const;
