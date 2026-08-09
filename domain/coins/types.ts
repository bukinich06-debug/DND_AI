import type { CoinOwnerKind } from './constants';

export interface ICoins {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export interface ICoinOwner {
  kind: CoinOwnerKind;
  id: string;
}

export interface IGetCoins {
  campaignId: string;
  owner: ICoinOwner;
}

export interface ITransferCoins {
  campaignId: string;
  from: ICoinOwner;
  to: ICoinOwner;
  amountCp: number;
}

export interface ICoinBalance {
  owner: ICoinOwner;
  coinsCp: number;
  coins: ICoins;
}

export interface ITransferCoinsResult {
  from: ICoinBalance;
  to: ICoinBalance;
  amountCp: number;
}

export interface ICoinPurse {
  coinsCp: number;
  campaignId: string;
}

export interface ICoinRepository {
  getPurse: (owner: ICoinOwner) => Promise<ICoinPurse | null>;
  transfer: (input: Omit<ITransferCoins, 'campaignId'>) => Promise<{ fromCoinsCp: number; toCoinsCp: number }>;
}
