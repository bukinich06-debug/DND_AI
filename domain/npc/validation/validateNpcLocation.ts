import type { ISetNpcLocation } from '../locationTypes';

export const validateSetNpcLocation = (input: ISetNpcLocation) => {
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  if (!input.locationId.trim()) throw new Error('Локация обязательна.');
};
