import type { DiceKind } from '@/domain/shared';

export interface IDiceRoll {
  id: string;
  campaignId: string;
  die: DiceKind;
  value: number;
  note: string | null;
  playerId: string | null;
  npcId: string | null;
  rolledAt: Date;
}

export interface IRollDice {
  campaignId: string;
  die: DiceKind;
  note?: string | null;
  playerId?: string | null;
  npcId?: string | null;
}

export interface ICreateDiceRoll {
  campaignId: string;
  die: DiceKind;
  value: number;
  note?: string | null;
  playerId?: string | null;
  npcId?: string | null;
}

export interface IDiceRollRepository {
  create: (input: ICreateDiceRoll) => Promise<IDiceRoll>;
  getById: (id: string) => Promise<IDiceRoll | null>;
  listByCampaignId: (campaignId: string) => Promise<IDiceRoll[]>;
}
