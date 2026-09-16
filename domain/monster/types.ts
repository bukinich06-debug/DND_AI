export interface IMonsterInstance {
  id: string;
  campaignId: string;
  catalogKey: string;
  name: string;
  hpMax: number;
  hpCurrent: number;
  ac: number;
  speed: number;
  initiativeBonus: number | null;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  saveProf: string[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
  conditions: string[];
}

export type ICreateMonsterInstance = Omit<IMonsterInstance, 'id' | 'conditions'> & {
  conditions?: string[];
};

export type IUpdateMonsterInstance = Partial<Omit<ICreateMonsterInstance, 'campaignId' | 'catalogKey'>>;

export interface IMonsterInstanceRepository {
  create: (input: ICreateMonsterInstance) => Promise<IMonsterInstance>;
  getById: (id: string) => Promise<IMonsterInstance | null>;
  listByCampaignId: (campaignId: string) => Promise<IMonsterInstance[]>;
  update: (id: string, input: IUpdateMonsterInstance) => Promise<IMonsterInstance>;
  delete: (id: string) => Promise<void>;
}
