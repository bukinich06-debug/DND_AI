'use server';

import { campaignRepository } from '@/data/campaign';
import { encounterRepository, encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster-instance';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDie } from '@/domain/dice';
import { getCatalogMonsterByKey } from '@/domain/monster';
import { abilityMod } from '@/domain/player';

interface IEnemyInput {
  catalogKey: string;
  count: number;
}

interface IStartCombatInput {
  campaignId: string;
  enemies: IEnemyInput[];
  allyNpcIds?: string[];
  locationId?: string;
}

interface ICombatantResult {
  name: string;
  initiative: number;
  order: number;
  kind: 'player' | 'npc' | 'monster';
}

interface IStartCombatResult {
  encounterId: string;
  combatants: ICombatantResult[];
}

export const startCombat = async (input: IStartCombatInput): Promise<IStartCombatResult> => {
  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const activeEncounter = await encounterRepository.getActiveByCampaignId(input.campaignId);
  if (activeEncounter) throw new Error('Активная боевая сцена уже существует в этой кампании.');

  const players = await playerRepository.listByCampaignId(input.campaignId);
  if (players.length === 0) throw new Error('В кампании нет игроков.');

  const player = players[0];

  const effectiveLocationId = input.locationId ?? player.locationId;

  const allyNpcs = [];
  const allyStatBlocks = [];
  if (input.allyNpcIds && input.allyNpcIds.length > 0) {
    for (const npcId of input.allyNpcIds) {
      const npc = await npcRepository.getById(npcId);
      if (!npc) throw new Error(`НПС с id ${npcId} не найден.`);
      if (npc.campaignId !== input.campaignId) throw new Error(`НПС ${npc.name} не принадлежит этой кампании.`);

      const statBlock = await npcStatBlockRepository.getByNpcId(npcId);
      if (!statBlock) throw new Error(`У НПС ${npc.name} нет блока характеристик для боя.`);

      allyNpcs.push(npc);
      allyStatBlocks.push(statBlock);
    }
  }

  const monsterInstances = [];
  for (const enemy of input.enemies) {
    if (enemy.count < 1) throw new Error(`Количество врагов должно быть >= 1 для ключа ${enemy.catalogKey}.`);

    const catalogEntry = getCatalogMonsterByKey(enemy.catalogKey);

    for (let i = 0; i < enemy.count; i++) {
      const instanceName = enemy.count > 1 ? `${catalogEntry.name} ${i + 1}` : catalogEntry.name;

      const instance = await monsterInstanceRepository.create({
        campaignId: input.campaignId,
        templateId: '',
        name: instanceName,
        hpCurrent: catalogEntry.hpMax,
        hpMax: catalogEntry.hpMax,
        size: catalogEntry.size,
        creatureType: catalogEntry.creatureType,
        challengeRating: catalogEntry.challengeRating,
        proficiencyBonus: catalogEntry.proficiencyBonus,
        str: catalogEntry.str,
        dex: catalogEntry.dex,
        con: catalogEntry.con,
        int: catalogEntry.int,
        wis: catalogEntry.wis,
        cha: catalogEntry.cha,
        ac: catalogEntry.ac,
        speed: catalogEntry.speed,
        initiativeBonus: catalogEntry.initiativeBonus,
        saveProf: catalogEntry.saveProf,
        resistances: catalogEntry.resistances,
        immunities: catalogEntry.immunities,
        vulnerabilities: catalogEntry.vulnerabilities,
        conditionImmunities: catalogEntry.conditionImmunities,
        senses: catalogEntry.senses,
        languages: catalogEntry.languages,
        traits: catalogEntry.traits,
        actions: catalogEntry.actions,
        reactions: catalogEntry.reactions,
        legendaryActions: catalogEntry.legendaryActions,
      });

      monsterInstances.push(instance);
    }
  }

  const combatants: Array<{
    name: string;
    initiative: number;
    playerId?: string;
    npcId?: string;
    monsterInstanceId?: string;
    kind: 'player' | 'npc' | 'monster';
  }> = [];

  const playerInitiativeRoll = rollDie(20);
  const playerInitiativeBonus = (player.initiativeBonus ?? 0) + abilityMod(player.dex);
  combatants.push({
    name: player.name,
    initiative: playerInitiativeRoll + playerInitiativeBonus,
    playerId: player.id,
    kind: 'player',
  });

  for (let i = 0; i < allyNpcs.length; i++) {
    const npc = allyNpcs[i];
    const statBlock = allyStatBlocks[i];
    const npcInitiativeRoll = rollDie(20);
    const npcInitiativeBonus = (statBlock.initiativeBonus ?? 0) + abilityMod(statBlock.dex);
    combatants.push({
      name: npc.name,
      initiative: npcInitiativeRoll + npcInitiativeBonus,
      npcId: npc.id,
      kind: 'npc',
    });
  }

  for (const instance of monsterInstances) {
    const monsterInitiativeRoll = rollDie(20);
    const monsterInitiativeBonus = (instance.initiativeBonus ?? 0) + abilityMod(instance.dex);
    combatants.push({
      name: instance.name,
      initiative: monsterInitiativeRoll + monsterInitiativeBonus,
      monsterInstanceId: instance.id,
      kind: 'monster',
    });
  }

  combatants.sort((a, b) => b.initiative - a.initiative);

  const encounter = await encounterRepository.create({
    campaignId: input.campaignId,
    locationId: effectiveLocationId,
  });

  for (let i = 0; i < combatants.length; i++) {
    const combatant = combatants[i];
    await encounterParticipantRepository.create({
      encounterId: encounter.id,
      initiative: combatant.initiative,
      order: i,
      playerId: combatant.playerId ?? null,
      npcId: combatant.npcId ?? null,
      monsterInstanceId: combatant.monsterInstanceId ?? null,
    });
  }

  return {
    encounterId: encounter.id,
    combatants: combatants.map((c, i) => ({
      name: c.name,
      initiative: c.initiative,
      order: i,
      kind: c.kind,
    })),
  };
};
