import type { TimeOfDay } from '@/domain/shared';
import { slotIndex } from '@/domain/world-clock';
import type { IWorldEvent } from '../types';
import { isMeetingDue } from './isMeetingDue';

interface IClock {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

const sortMeetings = (events: IWorldEvent[]) => {
  const list = events.filter((e) => e.npcId);
  list.sort((a, b) => {
    const dayA = a.dayIndex ?? 0;
    const dayB = b.dayIndex ?? 0;
    if (dayA !== dayB) return dayA - dayB;
    const slotDiff = slotIndex(a.slot) - slotIndex(b.slot);
    if (slotDiff !== 0) return slotDiff;
    return a.id.localeCompare(b.id);
  });
  return list;
};

export const pickSoonestMeeting = (events: IWorldEvent[], clock: IClock): IWorldEvent | null => {
  const list = sortMeetings(events);
  if (list.length === 0) return null;

  const due = list.find((e) => isMeetingDue(e, clock, e.locationId));
  if (due) return due;
  return list[0];
};
