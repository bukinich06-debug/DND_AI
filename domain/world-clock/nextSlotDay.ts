import type { TimeOfDay } from '@/domain/shared';
import { TIME_OF_DAY_ORDER } from './constants';

interface IClock {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

export const slotIndex = (slot: TimeOfDay) => TIME_OF_DAY_ORDER.indexOf(slot);

export const nextSlotDay = (clock: IClock, slot: TimeOfDay) => {
  if (slotIndex(slot) >= slotIndex(clock.timeOfDay)) return clock.dayIndex;
  return clock.dayIndex + 1;
};
