export interface IMonsterTemplate {
  id: string;
  campaignId: string;
  name: string;
  summary: string | null;
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
  hpMax: number;
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
  lootCoinsCp: number;
}

export type ICreateMonsterTemplate = Omit<IMonsterTemplate, 'id' | 'lootCoinsCp'> & {
  lootCoinsCp?: number;
};

export type IUpdateMonsterTemplate = Partial<Omit<ICreateMonsterTemplate, 'campaignId'>>;

export interface IMonsterTemplateRepository {
  create: (input: ICreateMonsterTemplate) => Promise<IMonsterTemplate>;
  getById: (id: string) => Promise<IMonsterTemplate | null>;
  listByCampaignId: (campaignId: string) => Promise<IMonsterTemplate[]>;
  update: (id: string, input: IUpdateMonsterTemplate) => Promise<IMonsterTemplate>;
  delete: (id: string) => Promise<void>;
}
