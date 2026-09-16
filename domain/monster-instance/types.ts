export interface IMonsterInstance {
  id: string;
  campaignId: string;
  templateId: string;
  name: string;
  hpCurrent: number;
  hpMax: number;
  size: string | null;
  creatureType: string | null;
  challengeRating: string | null;
  proficiencyBonus: number | null;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  ac: number;
  speed: number;
  initiativeBonus: number | null;
  saveProf: string[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
  senses: string[];
  languages: string[];
  traits: unknown;
  actions: unknown;
  reactions: unknown;
  legendaryActions: unknown;
}

export type ICreateMonsterInstance = Omit<IMonsterInstance, 'id'>;

export type IUpdateMonsterInstance = Partial<Omit<ICreateMonsterInstance, 'campaignId' | 'templateId'>>;

export interface IMonsterInstanceRepository {
  create: (input: ICreateMonsterInstance) => Promise<IMonsterInstance>;
  getById: (id: string) => Promise<IMonsterInstance | null>;
  listByCampaignId: (campaignId: string) => Promise<IMonsterInstance[]>;
  listByEncounterId: (encounterId: string) => Promise<IMonsterInstance[]>;
  update: (id: string, input: IUpdateMonsterInstance) => Promise<IMonsterInstance>;
  delete: (id: string) => Promise<void>;
}
