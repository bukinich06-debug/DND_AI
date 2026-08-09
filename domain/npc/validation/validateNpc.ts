import type { ICreateNpc, IUpdateNpc } from '../types';

const validateCore = (input: Partial<ICreateNpc>) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Имя NPC обязательно.');
  if (input.appearance !== undefined && !input.appearance.trim()) throw new Error('Внешность NPC обязательна.');
  if (input.personality !== undefined && !input.personality.trim()) throw new Error('Характер NPC обязателен.');
  if (input.speech !== undefined && !input.speech.trim()) throw new Error('Речь NPC обязательна.');
  if (input.habits !== undefined && !input.habits.trim()) throw new Error('Привычки NPC обязательны.');
};

export const validateCreateNpc = (input: ICreateNpc) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.name.trim()) throw new Error('Имя NPC обязательно.');
  if (!input.appearance.trim()) throw new Error('Внешность NPC обязательна.');
  if (!input.personality.trim()) throw new Error('Характер NPC обязателен.');
  if (!input.speech.trim()) throw new Error('Речь NPC обязательна.');
  if (!input.habits.trim()) throw new Error('Привычки NPC обязательны.');
};

export const validateUpdateNpc = (input: IUpdateNpc) => {
  validateCore(input);
};
