import type { WorldEvent } from '@/generated/client';
import type { IScheduleMeeting, IWorldEvent, IWorldEventRepository } from '@/domain/world-event';
import { WorldEventStatus, WorldEventWhen, type TimeOfDay } from '@/domain/shared';
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
        dayIndex: input.dayIndex ?? null,
        locationId: input.locationId,
        playerId: input.playerId,
        npcId: input.npcId ?? null,
        title: input.title.trim(),
      },
    });
    return mapEvent(row);
  },

  listPendingByPlayer: async (campaignId, playerId) => {
    const rows = await db.worldEvent.findMany({
      where: { campaignId, playerId, status: WorldEventStatus.pending },
    });
    return rows.map(mapEvent);
  },

  markDone: async (id) => {
    const row = await db.worldEvent.update({
      where: { id },
      data: { status: WorldEventStatus.done },
    });
    return mapEvent(row);
  },
};
