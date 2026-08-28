'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { locationLinkRepository } from '@/data/location-link';
import { playerRepository } from '@/data/player';
import { findPath, getEdgeDays, settlementOf } from '@/domain/location';
import { validateStartTravel, type IPlayerLocation, type IStartTravel } from '@/domain/player';
import { buildPlayerLocation } from './helpers/buildPlayerLocation';

export const startTravel = async (input: IStartTravel): Promise<IPlayerLocation> => {
  validateStartTravel(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');
  if (!player.locationId) throw new Error('У игрока нет текущей локации.');

  const destination = await locationRepository.getById(input.destinationId);
  if (!destination) throw new Error('Целевая локация не найдена.');
  if (destination.campaignId !== input.campaignId) throw new Error('Целевая локация из другой кампании.');

  if (player.locationId === destination.id) throw new Error('Игрок уже в целевой локации.');

  const locations = await locationRepository.listByCampaignId(input.campaignId);
  const byId = new Map(locations.map((loc) => [loc.id, loc]));
  const fromSettlement = settlementOf(player.locationId, byId);
  const toSettlement = settlementOf(destination.id, byId);
  if (!fromSettlement || !toSettlement) throw new Error('Путь до цели не найден.');
  if (fromSettlement.id === toSettlement.id)
    throw new Error('Цель в том же поселении — используйте мгновенное перемещение.');

  const links = await locationLinkRepository.listByCampaignId(input.campaignId);
  const edges = links.map((link) => ({ fromId: link.fromId, toId: link.toId, days: link.days }));
  const path = findPath(fromSettlement.id, toSettlement.id, edges);
  if (!path || path.length < 2) throw new Error('Путь до цели не найден.');

  const route = path.slice(1);
  const firstDays = getEdgeDays(path[0], path[1], edges);
  if (firstDays == null) throw new Error('Путь до цели не найден.');

  const updated = await playerRepository.updateLocationState(player.id, {
    locationId: player.locationId,
    travelDestinationId: destination.id,
    travelRoute: route,
    travelLegIndex: 0,
    travelDaysLeft: firstDays,
  });

  return buildPlayerLocation(updated);
};
