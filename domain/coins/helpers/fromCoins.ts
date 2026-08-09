import { CP_PER_EP, CP_PER_GP, CP_PER_PP, CP_PER_SP } from '../constants';
import type { ICoins } from '../types';

export const fromCoins = (coins: ICoins) =>
  coins.pp * CP_PER_PP + coins.gp * CP_PER_GP + coins.ep * CP_PER_EP + coins.sp * CP_PER_SP + coins.cp;
