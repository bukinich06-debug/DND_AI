/** 1 sp = 10 cp, 1 ep = 50 cp, 1 gp = 100 cp, 1 pp = 1000 cp */
export const CP_PER_SP = 10;
export const CP_PER_EP = 50;
export const CP_PER_GP = 100;
export const CP_PER_PP = 1000;

export const CoinOwnerKind = {
  player: 'player',
  npc: 'npc',
  item: 'item',
} as const;

export type CoinOwnerKind = (typeof CoinOwnerKind)[keyof typeof CoinOwnerKind];
