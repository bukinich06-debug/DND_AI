import type { MonsterTemplate } from '@/generated/client';
import type {
  ICreateMonsterTemplate,
  IMonsterTemplate,
  IMonsterTemplateRepository,
  IUpdateMonsterTemplate,
} from '@/domain/monster-template';
import { db } from '@/data/shared';

const mapTemplate = (row: MonsterTemplate): IMonsterTemplate => ({
  id: row.id,
  campaignId: row.campaignId,
  name: row.name,
  summary: row.summary,
  size: row.size,
  creatureType: row.creatureType,
  challengeRating: row.challengeRating,
  proficiencyBonus: row.proficiencyBonus,
  str: row.str,
  dex: row.dex,
  con: row.con,
  int: row.int,
  wis: row.wis,
  cha: row.cha,
  hpMax: row.hpMax,
  ac: row.ac,
  speed: row.speed,
  initiativeBonus: row.initiativeBonus,
  saveProf: row.saveProf,
  resistances: row.resistances,
  immunities: row.immunities,
  vulnerabilities: row.vulnerabilities,
  conditionImmunities: row.conditionImmunities,
  senses: row.senses,
  languages: row.languages,
  traits: row.traits,
  actions: row.actions,
  reactions: row.reactions,
  legendaryActions: row.legendaryActions,
});

export const monsterTemplateRepository: IMonsterTemplateRepository = {
  create: async (input: ICreateMonsterTemplate) => {
    const row = await db.monsterTemplate.create({
      data: {
        campaignId: input.campaignId,
        name: input.name.trim(),
        summary: input.summary ?? null,
        size: input.size ?? null,
        creatureType: input.creatureType ?? null,
        challengeRating: input.challengeRating ?? null,
        proficiencyBonus: input.proficiencyBonus ?? null,
        str: input.str,
        dex: input.dex,
        con: input.con,
        int: input.int,
        wis: input.wis,
        cha: input.cha,
        hpMax: input.hpMax,
        ac: input.ac,
        speed: input.speed,
        initiativeBonus: input.initiativeBonus ?? null,
        saveProf: input.saveProf,
        resistances: input.resistances,
        immunities: input.immunities,
        vulnerabilities: input.vulnerabilities,
        conditionImmunities: input.conditionImmunities,
        senses: input.senses,
        languages: input.languages,
        traits: input.traits ?? undefined,
        actions: input.actions ?? undefined,
        reactions: input.reactions ?? undefined,
        legendaryActions: input.legendaryActions ?? undefined,
      },
    });
    return mapTemplate(row);
  },

  getById: async (id) => {
    const row = await db.monsterTemplate.findUnique({ where: { id } });
    if (!row) return null;
    return mapTemplate(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.monsterTemplate.findMany({ where: { campaignId }, orderBy: { name: 'asc' } });
    return rows.map(mapTemplate);
  },

  update: async (id, input: IUpdateMonsterTemplate) => {
    const row = await db.monsterTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.size !== undefined ? { size: input.size } : {}),
        ...(input.creatureType !== undefined ? { creatureType: input.creatureType } : {}),
        ...(input.challengeRating !== undefined ? { challengeRating: input.challengeRating } : {}),
        ...(input.proficiencyBonus !== undefined ? { proficiencyBonus: input.proficiencyBonus } : {}),
        ...(input.str !== undefined ? { str: input.str } : {}),
        ...(input.dex !== undefined ? { dex: input.dex } : {}),
        ...(input.con !== undefined ? { con: input.con } : {}),
        ...(input.int !== undefined ? { int: input.int } : {}),
        ...(input.wis !== undefined ? { wis: input.wis } : {}),
        ...(input.cha !== undefined ? { cha: input.cha } : {}),
        ...(input.hpMax !== undefined ? { hpMax: input.hpMax } : {}),
        ...(input.ac !== undefined ? { ac: input.ac } : {}),
        ...(input.speed !== undefined ? { speed: input.speed } : {}),
        ...(input.initiativeBonus !== undefined ? { initiativeBonus: input.initiativeBonus } : {}),
        ...(input.saveProf !== undefined ? { saveProf: input.saveProf } : {}),
        ...(input.resistances !== undefined ? { resistances: input.resistances } : {}),
        ...(input.immunities !== undefined ? { immunities: input.immunities } : {}),
        ...(input.vulnerabilities !== undefined ? { vulnerabilities: input.vulnerabilities } : {}),
        ...(input.conditionImmunities !== undefined ? { conditionImmunities: input.conditionImmunities } : {}),
        ...(input.senses !== undefined ? { senses: input.senses } : {}),
        ...(input.languages !== undefined ? { languages: input.languages } : {}),
        ...(input.traits !== undefined ? { traits: input.traits ?? undefined } : {}),
        ...(input.actions !== undefined ? { actions: input.actions ?? undefined } : {}),
        ...(input.reactions !== undefined ? { reactions: input.reactions ?? undefined } : {}),
        ...(input.legendaryActions !== undefined ? { legendaryActions: input.legendaryActions ?? undefined } : {}),
      },
    });
    return mapTemplate(row);
  },

  delete: async (id) => {
    await db.monsterTemplate.delete({ where: { id } });
  },
};
