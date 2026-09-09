import { TimeOfDay } from '@/domain/shared';

export const TIME_OF_DAY_ORDER: TimeOfDay[] = [
  TimeOfDay.morning,
  TimeOfDay.noon,
  TimeOfDay.afternoon,
  TimeOfDay.evening,
  TimeOfDay.lateEvening,
  TimeOfDay.midnight,
  TimeOfDay.night,
];

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: 'утро',
  noon: 'полдень',
  afternoon: 'послеполудня',
  evening: 'вечер',
  lateEvening: 'поздний вечер',
  midnight: 'полночь',
  night: 'ночь',
};
