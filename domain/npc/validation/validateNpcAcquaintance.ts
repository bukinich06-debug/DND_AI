import type { ISetNpcAcquaintance } from '../acquaintanceTypes';

export const validateSetNpcAcquaintance = (input: ISetNpcAcquaintance) => {
  if (!input.npcId.trim()) throw new Error('npcId обязателен.');
  if (!input.otherNpcId.trim()) throw new Error('otherNpcId обязателен.');
  if (input.npcId.trim() === input.otherNpcId.trim()) throw new Error('NPC не может быть знакомым сам с собой.');
};
