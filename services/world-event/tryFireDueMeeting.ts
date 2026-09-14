'use server';

import { campaignRepository } from '@/data/campaign';
import { locationRepository } from '@/data/location';
import { npcRepository } from '@/data/npc';
import { worldEventRepository } from '@/data/world-event';
import { isSameSettlement, type ILocation } from '@/domain/location';
import {
  isMeetingDue,
  isWaitMessage,
  pickMeetingHere,
  pickSoonestMeeting,
  type IWorldEvent,
} from '@/domain/world-event';
import { nextSlotDay } from '@/domain/world-clock';
import { updateCampaign } from '@/services/campaign/crud/updateCampaign';
import { setNpcLocation } from '@/services/npc/crud/setNpcLocation';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import type { TimeOfDay } from '@/domain/shared';

interface ITryFireDueMeetingParams {
  campaignId: string;
  playerId: string;
  message: string;
}

interface IFiredMeeting {
  npcId: string;
  npcName: string;
  title: string;
  locationId: string;
  locationName: string;
  requiresMove: boolean;
}

interface IClock {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

const loadAncestors = async (startId: string) => {
  const byId = new Map<string, ILocation>();
  let id: string | null = startId;
  while (id) {
    if (byId.has(id)) break;
    const loc = await locationRepository.getById(id);
    if (!loc) break;
    byId.set(loc.id, loc);
    id = loc.parentId;
  }
  return byId;
};

const canWalkToMeeting = async (hereId: string, meetingLocationId: string) => {
  const [hereMap, meetMap] = await Promise.all([loadAncestors(hereId), loadAncestors(meetingLocationId)]);
  const byId = new Map([...hereMap, ...meetMap]);
  return isSameSettlement(hereId, meetingLocationId, byId);
};

const fireEvent = async (
  campaignId: string,
  playerId: string,
  event: IWorldEvent,
  clock: IClock,
  hereId: string
): Promise<IFiredMeeting | null> => {
  if (!event.npcId) return null;

  const [npc, location] = await Promise.all([
    npcRepository.getById(event.npcId),
    locationRepository.getById(event.locationId),
  ]);

  if (!npc) throw new Error('NPC встречи не найден.');
  if (!location) throw new Error('Локация встречи не найдена.');

  const requiresMove = event.locationId !== hereId;

  const due = isMeetingDue(event, clock, hereId);
  if (!due) {
    const dayIndex = event.dayIndex ?? nextSlotDay(clock, event.slot);
    await updateCampaign(campaignId, { dayIndex, timeOfDay: event.slot });
  }

  await setNpcLocation({ npcId: event.npcId, locationId: event.locationId, isPrimary: true });
  await worldEventRepository.markDone(event.id);

  return {
    npcId: event.npcId,
    npcName: npc.name,
    title: event.title,
    locationId: event.locationId,
    locationName: location.name,
    requiresMove,
  };
};

/**
 * Пытается запустить назначенную встречу.
 *
 * **Очередь встреч:** если несколько встреч назначены на один слот (день + время),
 * они обрабатываются по одной за ход в стабильном порядке (день → слот → id).
 * Остальные остаются pending до следующего хода.
 *
 * **Логика:**
 * 1. Проверяет, есть ли встреча в текущей локации (due или ближайшая).
 *    - Если due или игрок ждёт → запускает встречу.
 * 2. Если нет встречи здесь и игрок ждёт → ищет ближайшую walkable встречу.
 *    - Если найдена → запускает встречу (игрок должен будет идти туда).
 *
 * **Возврат:** `IFiredMeeting` с полным контекстом (кто, где, название, нужно ли перемещение).
 * Вызывающий код (turn/master) должен обработать сигнал: показать сообщение,
 * переместить игрока если `requiresMove === true`, запустить диалог с NPC.
 *
 * @returns `IFiredMeeting` если встреча запущена, `null` если ничего не запущено.
 */
export const tryFireDueMeeting = async ({
  campaignId,
  playerId,
  message,
}: ITryFireDueMeetingParams): Promise<IFiredMeeting | null> => {
  const campaign = await campaignRepository.getById(campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const playerLoc = await getPlayerLocation({ campaignId, playerId });
  const here = playerLoc.location;
  if (!here) return null;

  const pending = await worldEventRepository.listPendingByPlayer(campaignId, playerId);
  const clock = { dayIndex: campaign.dayIndex, timeOfDay: campaign.timeOfDay };
  const waiting = isWaitMessage(message);

  const hereEvent = pickMeetingHere(pending, here.id, clock);
  if (hereEvent) {
    if (!isMeetingDue(hereEvent, clock, here.id) && !waiting) return null;
    return fireEvent(campaignId, playerId, hereEvent, clock, here.id);
  }

  if (!waiting) return null;

  const soonest = pickSoonestMeeting(pending, clock);
  if (!soonest || !soonest.npcId) return null;
  if (!(await canWalkToMeeting(here.id, soonest.locationId))) return null;

  return fireEvent(campaignId, playerId, soonest, clock, here.id);
};
