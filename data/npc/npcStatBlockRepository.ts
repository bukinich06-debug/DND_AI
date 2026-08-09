import type { NpcStatBlock } from '@/generated/client';
import type { INpcStatBlock, INpcStatBlockRepository, IUpsertNpcStatBlock } from '@/domain/npc';
import { db } from '@/data/shared';

const mapStatBlock = (row: NpcStatBlock): INpcStatBlock => ({
  id: row.id,
  npcId: row.npcId,
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
  hpCurrent: row.hpCurrent,
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

export const npcStatBlockRepository: INpcStatBlockRepository = {
  getByNpcId: async (npcId) => {
    const row = await db.npcStatBlock.findUnique({ where: { npcId } });
    if (!row) return null;
    return mapStatBlock(row);
  },

  upsert: async (input: IUpsertNpcStatBlock) => {
    const data = {
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
      hpCurrent: input.hpCurrent,
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
    };

    const row = await db.npcStatBlock.upsert({
      where: { npcId: input.npcId },
      create: { npcId: input.npcId, ...data },
      update: data,
    });
    return mapStatBlock(row);
  },

  deleteByNpcId: async (npcId) => {
    await db.npcStatBlock.delete({ where: { npcId } });
  },
};
