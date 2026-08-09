'use server';

import { campaignRepository } from '@/data/campaign';
import { locationLinkRepository } from '@/data/location-link';
import { playerRepository } from '@/data/player';
import { getEdgeDays } from '@/domain/location';
import { validateAdvanceTravel, type IAdvanceTravel, type IPlayerLocation } from '@/domain/player';
import { buildPlayerLocation, clearTravelState } from './helpers/buildPlayerLocation';

export const advanceTravel = async (input: IAdvanceTravel): Promise<IPlayerLocation> => {
  validateAdvanceTravel(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  if (
    !player.travelDestinationId ||
    !player.travelRoute ||
    player.travelLegIndex == null ||
    player.travelDaysLeft == null
  )
    throw new Error('Игрок сейчас не путешествует.');

  let daysLeft = player.travelDaysLeft;
  let legIndex = player.travelLegIndex;
  let locationId = player.locationId;
  const route = player.travelRoute;
  let remaining = input.days ?? 1;

  const links = await locationLinkRepository.listByCampaignId(input.campaignId);
  const edges = links.map((link) => ({ fromId: link.fromId, toId: link.toId, days: link.days }));

  while (remaining > 0) {
    if (remaining < daysLeft) {
      daysLeft -= remaining;
      remaining = 0;
      break;
    }

    remaining -= daysLeft;

    if (legIndex >= route.length - 1) {
      const updated = await playerRepository.updateLocationState(player.id, {
        locationId: route[legIndex],
        ...clearTravelState,
      });
      return buildPlayerLocation(updated);
    }

    const fromId = route[legIndex];
    legIndex += 1;
    const toId = route[legIndex];
    const nextDays = getEdgeDays(fromId, toId, edges);
    if (nextDays == null) throw new Error('Путь прерван: нет ребра между локациями маршрута.');

    locationId = toId;
    daysLeft = nextDays;
  }

  const updated = await playerRepository.updateLocationState(player.id, {
    locationId,
    travelDestinationId: player.travelDestinationId,
    travelRoute: route,
    travelLegIndex: legIndex,
    travelDaysLeft: daysLeft,
  });

  return buildPlayerLocation(updated);
};
