import { QuestStatus } from '@/domain/shared';
import type { ICreateQuest, IUpdateQuest } from '../types';

const statuses = new Set<string>(Object.values(QuestStatus));

const validateCore = (input: Partial<ICreateQuest>) => {
  if (input.title !== undefined && !input.title.trim()) throw new Error('Название квеста обязательно.');
  if (input.description !== undefined && !input.description.trim()) throw new Error('Описание квеста обязательно.');
  if (input.status !== undefined && !statuses.has(input.status)) throw new Error('Неизвестный статус квеста.');
};

export const validateCreateQuest = (input: ICreateQuest) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.title.trim()) throw new Error('Название квеста обязательно.');
  if (!input.description.trim()) throw new Error('Описание квеста обязательно.');
  if (input.status !== undefined && !statuses.has(input.status)) throw new Error('Неизвестный статус квеста.');
};

export const validateUpdateQuest = (input: IUpdateQuest) => {
  validateCore(input);
};
