import type { MonsterInstance } from '@/generated/client';
import type {
  ICreateMonsterInstance,
  IMonsterInstance,
  IMonsterInstanceRepository,
  IUpdateMonsterInstance,
} from '@/domain/monster-instance';
import { db } from '@/data/shared';

const mapInstance = (row: MonsterInstance): IMonsterInstance => ({
  id: row.id,
  campaignId: row.campaignId,
  templateId: row.templateId,
  name: row.name,
  hpCurrent: row.hpCurrent,
  hpMax: row.hpMax,
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

export const monsterInstanceRepository: IMonsterInstanceRepository = {
  create: async (input: ICreateMonsterInstance) => {
    const row = await db.monsterInstance.create({
      data: {
        campaignId: input.campaignId,
        templateId: input.templateId,
        name: input.name.trim(),
        hpCurrent: input.hpCurrent,
        hpMax: input.hpMax,
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
    return mapInstance(row);
  },

  getById: async (id) => {
    const row = await db.monsterInstance.findUnique({ where: { id } });
    if (!row) return null;
    return mapInstance(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.monsterInstance.findMany({
      where: { campaignId },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapInstance);
  },

  listByEncounterId: async (encounterId) => {
    const rows = await db.monsterInstance.findMany({
      where: {
        participants: {
          some: {
            encounterId,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapInstance);
  },

  update: async (id, input: IUpdateMonsterInstance) => {
    const row = await db.monsterInstance.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.hpCurrent !== undefined ? { hpCurrent: input.hpCurrent } : {}),
        ...(input.hpMax !== undefined ? { hpMax: input.hpMax } : {}),
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
    return mapInstance(row);
  },

  delete: async (id) => {
    await db.monsterInstance.delete({ where: { id } });
  },
};
