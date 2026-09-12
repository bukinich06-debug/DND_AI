import { TimeOfDay, WorldEventWhen } from '@/domain/shared';
import type { IScheduleMeeting } from '../types';

const slots = new Set<string>(Object.values(TimeOfDay));
const whens = new Set<string>(Object.values(WorldEventWhen));

export const validateScheduleMeeting = (input: IScheduleMeeting) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.locationId.trim()) throw new Error('Локация обязательна.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.title.trim()) throw new Error('Название встречи обязательно.');
  if (!slots.has(input.slot)) throw new Error('Неизвестный слот суток.');
  if (!whens.has(input.whenKind)) throw new Error('Неизвестный способ задать время.');

  if (input.whenKind === WorldEventWhen.nextSlot) {
    if (input.dayIndex != null && (!Number.isInteger(input.dayIndex) || input.dayIndex < 1))
      throw new Error('Номер дня кампании должен быть целым от 1.');
    return;
  }

  if (input.dayIndex == null || !Number.isInteger(input.dayIndex) || input.dayIndex < 1)
    throw new Error('Для конкретного дня нужен номер дня кампании (от 1).');
};
