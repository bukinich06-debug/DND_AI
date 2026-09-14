import { MAX_EXHAUSTION_LEVEL } from '../constants';

export const syncDeath = (exhaustionLevel: number, dead: boolean): boolean => {
  if (exhaustionLevel >= MAX_EXHAUSTION_LEVEL) return true;
  return dead;
};
