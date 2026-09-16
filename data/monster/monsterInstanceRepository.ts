import type { MonsterInstance } from '@/generated/client';
import type {
  ICreateMonsterInstance,
  IMonsterInstance,
  IMonsterInstanceRepository,
  IUpdateMonsterInstance,
} from '@/domain/monster';
import { db } from '@/data/shared';

const mapInstance = (row: MonsterInstance): IMonsterInstance => ({
  id: row.id,
  campaignId: row.campaignId,
  catalogKey: row.catalogKey,
  name: row.name,
  hpMax: row.hpMax,
  hpCurrent: row.hpCurrent,
  ac: row.ac,
  speed: row.speed,
  initiativeBonus: row.initiativeBonus,
  str: row.str,
  dex: row.dex,
  con: row.con,
  int: row.int,
  wis: row.wis,
  cha: row.cha,
  saveProf: row.saveProf,
  resistances: row.resistances,
  immunities: row.immunities,
  vulnerabilities: row.vulnerabilities,
  conditionImmunities: row.conditionImmunities,
  conditions: row.conditions,
});

export const monsterInstanceRepository: IMonsterInstanceRepository = {
  create: async (input: ICreateMonsterInstance) => {
    const row = await db.monsterInstance.create({
      data: {
        campaignId: input.campaignId,
        catalogKey: input.catalogKey,
        name: input.name.trim(),
        hpMax: input.hpMax,
        hpCurrent: input.hpCurrent,
        ac: input.ac,
        speed: input.speed,
        initiativeBonus: input.initiativeBonus ?? null,
        str: input.str,
        dex: input.dex,
        con: input.con,
        int: input.int,
        wis: input.wis,
        cha: input.cha,
        saveProf: input.saveProf,
        resistances: input.resistances,
        immunities: input.immunities,
        vulnerabilities: input.vulnerabilities,
        conditionImmunities: input.conditionImmunities,
        conditions: input.conditions ?? [],
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
    const rows = await db.monsterInstance.findMany({ where: { campaignId }, orderBy: { name: 'asc' } });
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
        ...(input.hpMax !== undefined ? { hpMax: input.hpMax } : {}),
        ...(input.hpCurrent !== undefined ? { hpCurrent: input.hpCurrent } : {}),
        ...(input.ac !== undefined ? { ac: input.ac } : {}),
        ...(input.speed !== undefined ? { speed: input.speed } : {}),
        ...(input.initiativeBonus !== undefined ? { initiativeBonus: input.initiativeBonus } : {}),
        ...(input.str !== undefined ? { str: input.str } : {}),
        ...(input.dex !== undefined ? { dex: input.dex } : {}),
        ...(input.con !== undefined ? { con: input.con } : {}),
        ...(input.int !== undefined ? { int: input.int } : {}),
        ...(input.wis !== undefined ? { wis: input.wis } : {}),
        ...(input.cha !== undefined ? { cha: input.cha } : {}),
        ...(input.saveProf !== undefined ? { saveProf: input.saveProf } : {}),
        ...(input.resistances !== undefined ? { resistances: input.resistances } : {}),
        ...(input.immunities !== undefined ? { immunities: input.immunities } : {}),
        ...(input.vulnerabilities !== undefined ? { vulnerabilities: input.vulnerabilities } : {}),
        ...(input.conditionImmunities !== undefined ? { conditionImmunities: input.conditionImmunities } : {}),
        ...(input.conditions !== undefined ? { conditions: input.conditions } : {}),
      },
    });
    return mapInstance(row);
  },

  delete: async (id) => {
    await db.monsterInstance.delete({ where: { id } });
  },
};
