import { TimeOfDay } from '@/domain/shared';
import type { ICreateCampaign, IUpdateCampaign } from '../types';

const slots = new Set<string>(Object.values(TimeOfDay));

export const validateCreateCampaign = (input: ICreateCampaign) => {
  if (!input.name.trim()) throw new Error('Название кампании обязательно.');
};

export const validateUpdateCampaign = (input: IUpdateCampaign) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Название кампании обязательно.');
  if (input.dayIndex !== undefined && (!Number.isInteger(input.dayIndex) || input.dayIndex < 1))
    throw new Error('Номер дня кампании должен быть целым от 1.');
  if (input.timeOfDay !== undefined && !slots.has(input.timeOfDay)) throw new Error('Неизвестный слот суток.');
};
