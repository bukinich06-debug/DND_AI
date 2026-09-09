import type { TimeOfDay, WorldEventStatus, WorldEventWhen } from '@/domain/shared';

export interface IWorldEvent {
  id: string;
  campaignId: string;
  status: WorldEventStatus;
  whenKind: WorldEventWhen;
  slot: TimeOfDay;
  dayIndex: number | null;
  locationId: string;
  playerId: string;
  npcId: string | null;
  title: string;
}

export interface IScheduleMeeting {
  campaignId: string;
  whenKind: WorldEventWhen;
  slot: TimeOfDay;
  dayIndex?: number | null;
  locationId: string;
  playerId: string;
  npcId?: string | null;
  title: string;
}

export interface IWorldEventRepository {
  create: (input: IScheduleMeeting) => Promise<IWorldEvent>;
}
