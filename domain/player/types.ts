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
}

export type ICreatePlayer = Omit<IPlayer, 'id' | 'hpTemp' | 'inspiration' | 'deathSaveSuccess' | 'deathSaveFail'> & {
  hpTemp?: number;
  inspiration?: boolean;
  deathSaveSuccess?: number;
  deathSaveFail?: number;
};

export type IUpdatePlayer = Partial<Omit<ICreatePlayer, 'campaignId'>>;

export interface IPlayerRepository {
  create: (input: ICreatePlayer) => Promise<IPlayer>;
  getById: (id: string) => Promise<IPlayer | null>;
  listByCampaignId: (campaignId: string) => Promise<IPlayer[]>;
  update: (id: string, input: IUpdatePlayer) => Promise<IPlayer>;
  delete: (id: string) => Promise<void>;
}
