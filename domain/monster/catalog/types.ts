export interface IMonsterAbility {
  name: string;
  description: string;
}

export interface IMonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  damageType?: string;
}

export interface IMonsterCatalogEntry {
  key: string;
  aliases: string[];
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
  traits: IMonsterAbility[] | null;
  actions: IMonsterAction[] | null;
  reactions: IMonsterAbility[] | null;
  legendaryActions: IMonsterAction[] | null;
  lootCoinsCp: number;
}

export interface ISearchMonsterCatalogResult {
  query: string | null;
  exact: boolean;
  monsters: IMonsterCatalogEntry[];
}
