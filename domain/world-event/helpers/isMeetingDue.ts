import { WorldEventStatus, type TimeOfDay } from '@/domain/shared';
import { nextSlotDay, slotIndex } from '@/domain/world-clock';
import type { IWorldEvent } from '../types';

interface IClock {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

export const isMeetingDue = (event: IWorldEvent, clock: IClock, playerLocationId: string) => {
  if (event.status !== WorldEventStatus.pending) return false;
  if (event.locationId !== playerLocationId) return false;

  const day = event.dayIndex ?? nextSlotDay(clock, event.slot);
  if (clock.dayIndex > day) return true;
  if (clock.dayIndex < day) return false;
  return slotIndex(clock.timeOfDay) >= slotIndex(event.slot);
};
