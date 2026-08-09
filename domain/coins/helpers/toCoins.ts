import { CP_PER_EP, CP_PER_GP, CP_PER_PP, CP_PER_SP } from '../constants';
import type { ICoins } from '../types';

export const toCoins = (coinsCp: number): ICoins => {
  let rest = coinsCp;
  const pp = Math.floor(rest / CP_PER_PP);
  rest -= pp * CP_PER_PP;
  const gp = Math.floor(rest / CP_PER_GP);
  rest -= gp * CP_PER_GP;
  const ep = Math.floor(rest / CP_PER_EP);
  rest -= ep * CP_PER_EP;
  const sp = Math.floor(rest / CP_PER_SP);
  rest -= sp * CP_PER_SP;
  return { pp, gp, ep, sp, cp: rest };
};
