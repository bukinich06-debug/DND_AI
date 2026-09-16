/** Общий боевой профиль для NPC и монстров */
export interface ICombatStats {
  name?: string;
  size?: string | null;
  creatureType?: string | null;
  challengeRating?: string | null;
  proficiencyBonus?: number | null;
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
  initiativeBonus?: number | null;
  saveProf: string[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
  senses: string[];
  languages: string[];
  traits?: unknown;
  actions?: unknown;
  reactions?: unknown;
  legendaryActions?: unknown;
}

/** Поля статблока NPC для маппинга в бой */
export interface INpcStatBlockSource {
  size?: string | null;
  creatureType?: string | null;
  challengeRating?: string | null;
  proficiencyBonus?: number | null;
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
  initiativeBonus?: number | null;
  saveProf: string[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
  senses: string[];
  languages: string[];
  traits?: unknown;
  actions?: unknown;
  reactions?: unknown;
  legendaryActions?: unknown;
}

/** Поля экземпляра монстра для маппинга в бой */
export interface IMonsterInstanceSource {
  name: string;
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
  initiativeBonus?: number | null;
  saveProf: string[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
}
