import type { Player } from '@/generated/client';
import type { ICreatePlayer, IPlayer, IPlayerRepository, IUpdatePlayer } from '@/domain/player';
import { db } from '@/data/shared';

const mapPlayer = (row: Player): IPlayer => ({
  id: row.id,
  campaignId: row.campaignId,
  name: row.name,
  species: row.species,
  className: row.className,
  subclass: row.subclass,
  background: row.background,
  level: row.level,
  xp: row.xp,
  alignment: row.alignment,
  str: row.str,
  dex: row.dex,
  con: row.con,
  int: row.int,
  wis: row.wis,
  cha: row.cha,
  hpMax: row.hpMax,
  hpCurrent: row.hpCurrent,
  hpTemp: row.hpTemp,
  hitDie: row.hitDie,
  hitDiceLeft: row.hitDiceLeft,
  ac: row.ac,
  speed: row.speed,
  initiativeBonus: row.initiativeBonus,
  proficiencyBonus: row.proficiencyBonus,
  inspiration: row.inspiration,
  deathSaveSuccess: row.deathSaveSuccess,
  deathSaveFail: row.deathSaveFail,
  armorProf: row.armorProf,
  weaponProf: row.weaponProf,
  toolProf: row.toolProf,
  languages: row.languages,
  skillProf: row.skillProf,
  skillExpertise: row.skillExpertise,
  saveProf: row.saveProf,
  features: row.features,
  spells: row.spells,
  notes: row.notes,
  portraitUrl: row.portraitUrl,
});

export const playerRepository: IPlayerRepository = {
  create: async (input: ICreatePlayer) => {
    const row = await db.player.create({
      data: {
        campaignId: input.campaignId,
        name: input.name.trim(),
        species: input.species.trim(),
        className: input.className.trim(),
        subclass: input.subclass ?? null,
        background: input.background.trim(),
        level: input.level,
        xp: input.xp ?? null,
        alignment: input.alignment ?? null,
        str: input.str,
        dex: input.dex,
        con: input.con,
        int: input.int,
        wis: input.wis,
        cha: input.cha,
        hpMax: input.hpMax,
        hpCurrent: input.hpCurrent,
        hpTemp: input.hpTemp ?? 0,
        hitDie: input.hitDie.trim(),
        hitDiceLeft: input.hitDiceLeft,
        ac: input.ac,
        speed: input.speed,
        initiativeBonus: input.initiativeBonus ?? null,
        proficiencyBonus: input.proficiencyBonus,
        inspiration: input.inspiration ?? false,
        deathSaveSuccess: input.deathSaveSuccess ?? 0,
        deathSaveFail: input.deathSaveFail ?? 0,
        armorProf: input.armorProf,
        weaponProf: input.weaponProf,
        toolProf: input.toolProf,
        languages: input.languages,
        skillProf: input.skillProf,
        skillExpertise: input.skillExpertise,
        saveProf: input.saveProf,
        features: input.features ?? undefined,
        spells: input.spells ?? undefined,
        notes: input.notes ?? null,
        portraitUrl: input.portraitUrl ?? null,
      },
    });
    return mapPlayer(row);
  },

  getById: async (id) => {
    const row = await db.player.findUnique({ where: { id } });
    if (!row) return null;
    return mapPlayer(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.player.findMany({ where: { campaignId }, orderBy: { name: 'asc' } });
    return rows.map(mapPlayer);
  },

  update: async (id, input: IUpdatePlayer) => {
    const row = await db.player.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.species !== undefined ? { species: input.species.trim() } : {}),
        ...(input.className !== undefined ? { className: input.className.trim() } : {}),
        ...(input.subclass !== undefined ? { subclass: input.subclass } : {}),
        ...(input.background !== undefined ? { background: input.background.trim() } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.xp !== undefined ? { xp: input.xp } : {}),
        ...(input.alignment !== undefined ? { alignment: input.alignment } : {}),
        ...(input.str !== undefined ? { str: input.str } : {}),
        ...(input.dex !== undefined ? { dex: input.dex } : {}),
        ...(input.con !== undefined ? { con: input.con } : {}),
        ...(input.int !== undefined ? { int: input.int } : {}),
        ...(input.wis !== undefined ? { wis: input.wis } : {}),
        ...(input.cha !== undefined ? { cha: input.cha } : {}),
        ...(input.hpMax !== undefined ? { hpMax: input.hpMax } : {}),
        ...(input.hpCurrent !== undefined ? { hpCurrent: input.hpCurrent } : {}),
        ...(input.hpTemp !== undefined ? { hpTemp: input.hpTemp } : {}),
        ...(input.hitDie !== undefined ? { hitDie: input.hitDie.trim() } : {}),
        ...(input.hitDiceLeft !== undefined ? { hitDiceLeft: input.hitDiceLeft } : {}),
        ...(input.ac !== undefined ? { ac: input.ac } : {}),
        ...(input.speed !== undefined ? { speed: input.speed } : {}),
        ...(input.initiativeBonus !== undefined ? { initiativeBonus: input.initiativeBonus } : {}),
        ...(input.proficiencyBonus !== undefined ? { proficiencyBonus: input.proficiencyBonus } : {}),
        ...(input.inspiration !== undefined ? { inspiration: input.inspiration } : {}),
        ...(input.deathSaveSuccess !== undefined ? { deathSaveSuccess: input.deathSaveSuccess } : {}),
        ...(input.deathSaveFail !== undefined ? { deathSaveFail: input.deathSaveFail } : {}),
        ...(input.armorProf !== undefined ? { armorProf: input.armorProf } : {}),
        ...(input.weaponProf !== undefined ? { weaponProf: input.weaponProf } : {}),
        ...(input.toolProf !== undefined ? { toolProf: input.toolProf } : {}),
        ...(input.languages !== undefined ? { languages: input.languages } : {}),
        ...(input.skillProf !== undefined ? { skillProf: input.skillProf } : {}),
        ...(input.skillExpertise !== undefined ? { skillExpertise: input.skillExpertise } : {}),
        ...(input.saveProf !== undefined ? { saveProf: input.saveProf } : {}),
        ...(input.features !== undefined ? { features: input.features ?? undefined } : {}),
        ...(input.spells !== undefined ? { spells: input.spells ?? undefined } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.portraitUrl !== undefined ? { portraitUrl: input.portraitUrl } : {}),
      },
    });
    return mapPlayer(row);
  },

  delete: async (id) => {
    await db.item.updateMany({ where: { playerId: id }, data: { playerId: null } });
    await db.player.delete({ where: { id } });
  },
};
