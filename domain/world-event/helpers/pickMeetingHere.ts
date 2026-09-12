import type { TimeOfDay } from '@/domain/shared';
import { slotIndex } from '@/domain/world-clock';
import type { IWorldEvent } from '../types';
import { isMeetingDue } from './isMeetingDue';

interface IClock {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

export const pickMeetingHere = (events: IWorldEvent[], locationId: string, clock: IClock): IWorldEvent | null => {
  const here = events.filter((e) => e.locationId === locationId && e.npcId);
  if (here.length === 0) return null;

  here.sort((a, b) => {
    const dayA = a.dayIndex ?? 0;
    const dayB = b.dayIndex ?? 0;
    if (dayA !== dayB) return dayA - dayB;
    return slotIndex(a.slot) - slotIndex(b.slot);
  });

  const due = here.find((e) => isMeetingDue(e, clock, locationId));
  if (due) return due;
  return here[0];
};
