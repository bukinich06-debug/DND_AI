import type { ILocation } from '@/domain/location';

export interface IPlayer {
  id: string;
  campaignId: string;
  name: string;
  species: string;
  className: string;
  subclass: string | null;
  background: string;
  level: number;
  xp: number | null;
  alignment: string | null;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  hitDie: string;
  hitDiceLeft: number;
  ac: number;
  speed: number;
  initiativeBonus: number | null;
  proficiencyBonus: number;
  inspiration: boolean;
  deathSaveSuccess: number;
  deathSaveFail: number;
  armorProf: string[];
  weaponProf: string[];
  toolProf: string[];
  languages: string[];
  skillProf: string[];
  skillExpertise: string[];
  saveProf: string[];
  features: unknown;
  spells: unknown;
  notes: string | null;
  portraitUrl: string | null;
  coinsCp: number;
  conditions: string[];
  exhaustionLevel: number;
  locationId: string | null;
  travelDestinationId: string | null;
  travelRoute: string[] | null;
  travelLegIndex: number | null;
  travelDaysLeft: number | null;
  shortRestsToday: number;
  shortRestDayIndex: number;
}

export type ICreatePlayer = Omit<
  IPlayer,
  | 'id'
  | 'hpTemp'
  | 'inspiration'
  | 'deathSaveSuccess'
  | 'deathSaveFail'
  | 'coinsCp'
  | 'conditions'
  | 'exhaustionLevel'
  | 'locationId'
  | 'travelDestinationId'
  | 'travelRoute'
  | 'travelLegIndex'
  | 'travelDaysLeft'
  | 'shortRestsToday'
  | 'shortRestDayIndex'
> & {
  hpTemp?: number;
  inspiration?: boolean;
  deathSaveSuccess?: number;
  deathSaveFail?: number;
  coinsCp?: number;
  conditions?: string[];
  exhaustionLevel?: number;
  locationId?: string | null;
};

export type IUpdatePlayer = Partial<Omit<ICreatePlayer, 'campaignId'>>;

export interface IPlayerLocationState {
  locationId?: string | null;
  travelDestinationId?: string | null;
  travelRoute?: string[] | null;
  travelLegIndex?: number | null;
  travelDaysLeft?: number | null;
}

export interface IGetPlayerProficiencies {
  campaignId: string;
  playerId: string;
}

export interface IPlayerProficiencies {
  playerId: string;
  proficiencyBonus: number;
  skillProf: string[];
  skillExpertise: string[];
  toolProf: string[];
  weaponProf: string[];
  armorProf: string[];
}

export interface IGetPlayerConditions {
  campaignId: string;
  playerId: string;
}

export interface IAddPlayerCondition {
  campaignId: string;
  playerId: string;
  condition: string;
  exhaustionLevel?: number | null;
}

export interface IRemovePlayerCondition {
  campaignId: string;
  playerId: string;
  condition: string;
  exhaustionLevel?: number | null;
}

export interface IApplyPlayerHp {
  campaignId: string;
  playerId: string;
  delta: number;
}

export interface IApplyPlayerHpResult {
  playerId: string;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  conditions: string[];
  exhaustionLevel: number;
}

export interface IShortRest {
  campaignId: string;
  playerId: string;
  hitDice: number;
}

export interface ILongRest {
  campaignId: string;
  playerId: string;
}

export interface IPlayerRestResult {
  playerId: string;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  hitDiceLeft: number;
  conditions: string[];
  exhaustionLevel: number;
  healed?: number;
  dice?: Array<{ die: string; value: number; conMod: number }>;
}

export interface IPlayerConditions {
  playerId: string;
  conditions: string[];
  exhaustionLevel: number;
  rules: Record<string, string>;
}

export interface IGetPlayerLocation {
  campaignId: string;
  playerId: string;
}

export interface IMovePlayer {
  campaignId: string;
  playerId: string;
  locationId: string;
}

export interface IStartTravel {
  campaignId: string;
  playerId: string;
  destinationId: string;
}

export interface IAdvanceTravel {
  campaignId: string;
  playerId: string;
  days?: number;
}

export interface IAdvanceTime {
  campaignId: string;
  slots: number;
}

export interface IPlayerTravelState {
  destinationId: string;
  destination: ILocation;
  route: string[];
  legIndex: number;
  daysLeft: number;
}

export interface IPlayerLocation {
  playerId: string;
  location: ILocation | null;
  travel: IPlayerTravelState | null;
}

export interface IPlayerRepository {
  create: (input: ICreatePlayer) => Promise<IPlayer>;
  getById: (id: string) => Promise<IPlayer | null>;
  listByCampaignId: (campaignId: string) => Promise<IPlayer[]>;
  update: (id: string, input: IUpdatePlayer) => Promise<IPlayer>;
  updateLocationState: (id: string, input: IPlayerLocationState) => Promise<IPlayer>;
  delete: (id: string) => Promise<void>;
}
