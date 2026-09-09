'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { worldEventRepository } from '@/data/world-event';
import { validateScheduleMeeting, type IScheduleMeeting } from '@/domain/world-event';

export const scheduleMeeting = async (input: IScheduleMeeting) => {
  validateScheduleMeeting(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const location = await locationRepository.getById(input.locationId);
  if (!location) throw new Error('Локация не найдена.');
  if (location.campaignId !== input.campaignId) throw new Error('Локация из другой кампании.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  if (input.npcId) {
    const npc = await npcRepository.getById(input.npcId);
    if (!npc) throw new Error('NPC не найден.');
    if (npc.campaignId !== input.campaignId) throw new Error('NPC не принадлежит этой кампании.');
  }

  return worldEventRepository.create(input);
};
