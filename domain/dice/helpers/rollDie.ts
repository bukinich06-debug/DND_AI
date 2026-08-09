import { randomInt } from 'crypto';

export const rollDie = (sides: number) => randomInt(1, sides + 1);
