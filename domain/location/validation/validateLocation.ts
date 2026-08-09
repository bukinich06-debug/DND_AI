import { LocationKind } from '@/domain/shared';
import type { ICreateLocation, IUpdateLocation } from '../types';

const kinds = new Set<string>(Object.values(LocationKind));

const validateCore = (input: Partial<ICreateLocation>) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Название локации обязательно.');
  if (input.summary !== undefined && !input.summary.trim()) throw new Error('Краткое описание локации обязательно.');
  if (input.description !== undefined && !input.description.trim()) throw new Error('Описание локации обязательно.');
  if (input.kind !== undefined && !kinds.has(input.kind)) throw new Error('Неизвестный тип локации.');
};

export const validateCreateLocation = (input: ICreateLocation) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.name.trim()) throw new Error('Название локации обязательно.');
  if (!input.summary.trim()) throw new Error('Краткое описание локации обязательно.');
  if (!input.description.trim()) throw new Error('Описание локации обязательно.');
  if (input.features === undefined || input.features === null) throw new Error('Особенности локации обязательны.');
  if (!kinds.has(input.kind)) throw new Error('Неизвестный тип локации.');
};

export const validateUpdateLocation = (input: IUpdateLocation) => {
  validateCore(input);
};

/** Проверка: newParentId не является потомком locationId (и не равен ему). */
export const wouldCreateLocationCycle = (
  locationId: string,
  newParentId: string | null,
  getParentId: (id: string) => string | null | undefined
) => {
  if (!newParentId) return false;
  if (newParentId === locationId) return true;

  let current: string | null | undefined = newParentId;
  const seen = new Set<string>();
  while (current) {
    if (current === locationId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    current = getParentId(current);
  }
  return false;
};
