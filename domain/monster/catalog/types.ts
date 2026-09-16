export interface IMonsterCatalogEntry {
  key: string;
  name: string;
  size: string;
  creatureType: string;
  challengeRating: string;
  proficiencyBonus: number;
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
}
