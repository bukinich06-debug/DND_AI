import type { TimeOfDay } from '@/domain/shared';
import { TIME_OF_DAY_ORDER } from './constants';

interface IClock {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

interface IAdvanceSlotsResult {
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

export const advanceSlots = (clock: IClock, slots: number): IAdvanceSlotsResult => {
  if (slots < 0) throw new Error('Slots must be non-negative');
  if (slots === 0) return { dayIndex: clock.dayIndex, timeOfDay: clock.timeOfDay };

  const currentIndex = TIME_OF_DAY_ORDER.indexOf(clock.timeOfDay);
  if (currentIndex === -1) throw new Error('Invalid timeOfDay value');

  const totalSlots = currentIndex + slots;
  const daysPassed = Math.floor(totalSlots / TIME_OF_DAY_ORDER.length);
  const newSlotIndex = totalSlots % TIME_OF_DAY_ORDER.length;

  return {
    dayIndex: clock.dayIndex + daysPassed,
    timeOfDay: TIME_OF_DAY_ORDER[newSlotIndex],
  };
};

export const snapToNextMorning = (clock: IClock): IAdvanceSlotsResult => {
  return {
    dayIndex: clock.dayIndex + 1,
    timeOfDay: TIME_OF_DAY_ORDER[0],
  };
};
