export interface INpcStatBlock {
  id: string;
  npcId: string;
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
  hpCurrent: number;
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

export type IUpsertNpcStatBlock = Omit<INpcStatBlock, 'id'>;

export interface INpcStatBlockRepository {
  getByNpcId: (npcId: string) => Promise<INpcStatBlock | null>;
  upsert: (input: IUpsertNpcStatBlock) => Promise<INpcStatBlock>;
  deleteByNpcId: (npcId: string) => Promise<void>;
}
