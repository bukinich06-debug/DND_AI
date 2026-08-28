'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { locationLinkRepository } from '@/data/location-link';
import { playerRepository } from '@/data/player';
import { findPath, settlementOf } from '@/domain/location';
import { validateMovePlayer, type IMovePlayer, type IPlayerLocation } from '@/domain/player';
import { movePlayer } from './movePlayer';
import { startTravel } from './startTravel';

export const goToLocation = async (input: IMovePlayer): Promise<IPlayerLocation> => {
  validateMovePlayer(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const destination = await locationRepository.getById(input.locationId);
  if (!destination) throw new Error('Локация не найдена.');
  if (destination.campaignId !== input.campaignId) throw new Error('Локация из другой кампании.');

  if (!player.locationId) return movePlayer(input);

  const locations = await locationRepository.listByCampaignId(input.campaignId);
  const byId = new Map(locations.map((loc) => [loc.id, loc]));
  const fromSettlement = settlementOf(player.locationId, byId);
  const toSettlement = settlementOf(destination.id, byId);

  if (!fromSettlement || !toSettlement || fromSettlement.id === toSettlement.id)
    return movePlayer(input);

  const links = await locationLinkRepository.listByCampaignId(input.campaignId);
  const edges = links.map((link) => ({ fromId: link.fromId, toId: link.toId, days: link.days }));
  const path = findPath(fromSettlement.id, toSettlement.id, edges);
  if (!path || path.length < 2) throw new Error('Путь до цели не найден.');

  return startTravel({
    campaignId: input.campaignId,
    playerId: input.playerId,
    destinationId: destination.id,
  });
};
