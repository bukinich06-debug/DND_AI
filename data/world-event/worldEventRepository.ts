import type { WorldEvent } from '@/generated/client';
import type { IScheduleMeeting, IWorldEvent, IWorldEventRepository } from '@/domain/world-event';
import { WorldEventWhen, type TimeOfDay, type WorldEventStatus } from '@/domain/shared';
import { db } from '@/data/shared';

const mapEvent = (row: WorldEvent): IWorldEvent => ({
  id: row.id,
  campaignId: row.campaignId,
  status: row.status as WorldEventStatus,
  whenKind: row.whenKind as WorldEventWhen,
  slot: row.slot as TimeOfDay,
  dayIndex: row.dayIndex,
  locationId: row.locationId,
  playerId: row.playerId,
  npcId: row.npcId,
  title: row.title,
});

export const worldEventRepository: IWorldEventRepository = {
  create: async (input: IScheduleMeeting) => {
    const row = await db.worldEvent.create({
      data: {
        campaignId: input.campaignId,
        whenKind: input.whenKind,
        slot: input.slot,
        dayIndex: input.whenKind === WorldEventWhen.nextSlot ? null : (input.dayIndex ?? null),
        locationId: input.locationId,
        playerId: input.playerId,
        npcId: input.npcId ?? null,
        title: input.title.trim(),
      },
    });
    return mapEvent(row);
  },
};
