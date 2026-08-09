import type { ICombatStats, IMonsterTemplateSource, INpcStatBlockSource } from './types';

const mapSharedFields = (
  source: Omit<ICombatStats, 'hpCurrent' | 'name'> & { name?: string },
  hpCurrent: number
): ICombatStats => ({
  name: source.name,
  size: source.size,
  creatureType: source.creatureType,
  challengeRating: source.challengeRating,
  proficiencyBonus: source.proficiencyBonus,
  str: source.str,
  dex: source.dex,
  con: source.con,
  int: source.int,
  wis: source.wis,
  cha: source.cha,
  hpMax: source.hpMax,
  hpCurrent,
  ac: source.ac,
  speed: source.speed,
  initiativeBonus: source.initiativeBonus,
  saveProf: source.saveProf,
  resistances: source.resistances,
  immunities: source.immunities,
  vulnerabilities: source.vulnerabilities,
  conditionImmunities: source.conditionImmunities,
  senses: source.senses,
  languages: source.languages,
  traits: source.traits,
  actions: source.actions,
  reactions: source.reactions,
  legendaryActions: source.legendaryActions,
});

export const mapNpcStatBlockToCombat = (source: INpcStatBlockSource, name?: string): ICombatStats =>
  mapSharedFields({ ...source, name }, source.hpCurrent);

export const mapMonsterTemplateToCombat = (source: IMonsterTemplateSource): ICombatStats =>
  mapSharedFields(source, source.hpMax);
