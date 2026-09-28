'use server';

import { campaignRepository } from '@/data/campaign';
import { encounterRepository, encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import { getCatalogMonsterByKey } from '@/domain/monster';
import { abilityMod } from '@/domain/player';

interface IEnemyInput {
  catalogKey: string;
  count: number;
  feetFromPlayer?: number;
}

interface IAllyInput {
  npcId: string;
  positionFeet?: number;
}

interface IStartCombatInput {
  campaignId: string;
  playerId: string;
  enemies: IEnemyInput[];
  allyNpcs?: IAllyInput[];
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

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');
  if (player.hpCurrent <= 0) throw new Error('Нельзя начать бой, когда игрок находится без сознания (0 HP).');

  const effectiveLocationId = input.locationId ?? player.locationId;

  const allyNpcs: Array<{
    npc: NonNullable<Awaited<ReturnType<typeof npcRepository.getById>>>;
    statBlock: NonNullable<Awaited<ReturnType<typeof npcStatBlockRepository.getByNpcId>>>;
    positionFeet?: number;
  }> = [];
  if (input.allyNpcs && input.allyNpcs.length > 0) {
    for (const allyInput of input.allyNpcs) {
      const npc = await npcRepository.getById(allyInput.npcId);
      if (!npc) throw new Error(`НПС с id ${allyInput.npcId} не найден.`);
      if (npc.campaignId !== input.campaignId) throw new Error(`НПС ${npc.name} не принадлежит этой кампании.`);

      const statBlock = await npcStatBlockRepository.getByNpcId(allyInput.npcId);
      if (!statBlock) throw new Error(`У НПС ${npc.name} нет блока характеристик для боя.`);

      allyNpcs.push({ npc, statBlock, positionFeet: allyInput.positionFeet });
    }
  }

  const monsterInstances: Array<{
    instance: Awaited<ReturnType<typeof monsterInstanceRepository.create>>;
    feetFromPlayer: number;
  }> = [];
  for (const enemy of input.enemies) {
    if (enemy.count < 1) throw new Error(`Количество врагов должно быть >= 1 для ключа ${enemy.catalogKey}.`);

    const catalogEntry = getCatalogMonsterByKey(enemy.catalogKey);
    const feetFromPlayer = enemy.feetFromPlayer ?? 30;

    for (let i = 0; i < enemy.count; i++) {
      const instanceName = enemy.count > 1 ? `${catalogEntry.name} ${i + 1}` : catalogEntry.name;

      const instance = await monsterInstanceRepository.create({
        campaignId: input.campaignId,
        catalogKey: enemy.catalogKey,
        name: instanceName,
        hpCurrent: catalogEntry.hpMax,
        hpMax: catalogEntry.hpMax,
        ac: catalogEntry.ac,
        speed: catalogEntry.speed,
        initiativeBonus: catalogEntry.initiativeBonus,
        str: catalogEntry.str,
        dex: catalogEntry.dex,
        con: catalogEntry.con,
        int: catalogEntry.int,
        wis: catalogEntry.wis,
        cha: catalogEntry.cha,
        saveProf: catalogEntry.saveProf,
        resistances: catalogEntry.resistances,
        immunities: catalogEntry.immunities,
        vulnerabilities: catalogEntry.vulnerabilities,
        conditionImmunities: catalogEntry.conditionImmunities,
      });

      monsterInstances.push({ instance, feetFromPlayer });
    }
  }

  const combatants: Array<{
    name: string;
    initiative: number;
    positionFeet: number;
    playerId?: string;
    npcId?: string;
    monsterInstanceId?: string;
    kind: 'player' | 'npc' | 'monster';
  }> = [];

  const playerInitiativeRoll = await rollDice({
    campaignId: input.campaignId,
    die: 'd20',
    note: 'инициатива',
    playerId: player.id,
  });
  const playerInitiativeBonus = (player.initiativeBonus ?? 0) + abilityMod(player.dex);

  combatants.push({
    name: player.name,
    initiative: playerInitiativeRoll.value + playerInitiativeBonus,
    positionFeet: 0,
    playerId: player.id,
    kind: 'player',
  });

  for (let i = 0; i < allyNpcs.length; i++) {
    const { npc, statBlock, positionFeet } = allyNpcs[i];
    const npcInitiativeRoll = await rollDice({
      campaignId: input.campaignId,
      die: 'd20',
      note: 'инициатива',
      npcId: npc.id,
    });
    const npcInitiativeBonus = (statBlock.initiativeBonus ?? 0) + abilityMod(statBlock.dex);
    const position = positionFeet !== undefined ? positionFeet : -5 - i * 5;
    combatants.push({
      name: npc.name,
      initiative: npcInitiativeRoll.value + npcInitiativeBonus,
      positionFeet: position,
      npcId: npc.id,
      kind: 'npc',
    });
  }

  for (const { instance, feetFromPlayer } of monsterInstances) {
    const monsterInitiativeRoll = await rollDice({
      campaignId: input.campaignId,
      die: 'd20',
      note: 'инициатива',
    });
    const monsterInitiativeBonus = (instance.initiativeBonus ?? 0) + abilityMod(instance.dex);
    combatants.push({
      name: instance.name,
      initiative: monsterInitiativeRoll.value + monsterInitiativeBonus,
      positionFeet: feetFromPlayer,
      monsterInstanceId: instance.id,
      kind: 'monster',
    });
  }

  combatants.sort((a, b) => b.initiative - a.initiative);

  const encounter = await encounterRepository.create({
    campaignId: input.campaignId,
    locationId: effectiveLocationId,
  });

  const playerPosition = 0;

  for (let i = 0; i < combatants.length; i++) {
    const combatant = combatants[i];
    const feetFromPlayer = combatant.playerId ? 0 : Math.abs(combatant.positionFeet - playerPosition);

    await encounterParticipantRepository.create({
      encounterId: encounter.id,
      initiative: combatant.initiative,
      order: i,
      feetFromPlayer,
      positionFeet: combatant.positionFeet,
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
