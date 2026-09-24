import { encounterRepository, encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { searchPlayerItems } from '@/services/item/search/searchPlayerItems';

interface ILoadCombatAgentContextParams {
  campaignId: string;
  encounterId: string;
  playerId: string;
}

interface IWeapon {
  id: string;
  name: string;
  equipSlot: string | null;
  properties: unknown;
}

export interface ICombatAgentContext {
  player: {
    id: string;
    name: string;
    hpMax: number;
    hpCurrent: number;
    ac: number;
    speed: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    proficiencyBonus: number;
    weapons: IWeapon[];
  };
  encounter: {
    id: string;
    round: number;
    currentTurnIndex: number;
    status: string;
  };
  participants: Array<{
    id: string;
    name: string;
    kind: 'player' | 'npc' | 'monster';
    initiative: number;
    order: number;
    isOut: boolean;
    hp: number | null;
    ac: number | null;
    feetFromPlayer: number;
    playerId: string | null;
    npcId: string | null;
    monsterInstanceId: string | null;
  }>;
}

export const loadCombatAgentContext = async ({
  campaignId,
  encounterId,
  playerId,
}: ILoadCombatAgentContextParams): Promise<ICombatAgentContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!encounterId.trim()) throw new Error('encounterId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const player = await playerRepository.getById(playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const encounter = await encounterRepository.getById(encounterId);
  if (!encounter) throw new Error('Боевая сцена не найдена.');
  if (encounter.campaignId !== campaignId) throw new Error('Боевая сцена не принадлежит этой кампании.');

  const equippedItems = await searchPlayerItems({
    campaignId,
    playerId,
    query: null,
  });

  const weapons = equippedItems.items
    .filter((item) => item.equipSlot === 'mainHand' || item.equipSlot === 'offHand' || item.equipSlot === 'ranged')
    .map((w) => ({
      id: w.id,
      name: w.name,
      equipSlot: w.equipSlot,
      properties: w.properties,
    }));

  const rawParticipants = await encounterParticipantRepository.listByEncounterId(encounterId);

  const participants = await Promise.all(
    rawParticipants.map(async (p) => {
      let name = 'Неизвестный';
      let kind: 'player' | 'npc' | 'monster' = 'monster';
      let hp: number | null = null;
      let ac: number | null = null;

      if (p.playerId) {
        const pl = await playerRepository.getById(p.playerId);
        if (pl) {
          name = pl.name;
          kind = 'player';
          hp = pl.hpCurrent;
          ac = pl.ac;
        }
      } else if (p.npcId) {
        const npc = await npcRepository.getById(p.npcId);
        if (npc) {
          name = npc.name;
          kind = 'npc';
          const statBlock = await npcStatBlockRepository.getByNpcId(p.npcId);
          hp = statBlock?.hpCurrent ?? null;
          ac = statBlock?.ac ?? null;
        }
      } else if (p.monsterInstanceId) {
        const m = await monsterInstanceRepository.getById(p.monsterInstanceId);
        if (m) {
          name = m.name;
          kind = 'monster';
          hp = m.hpCurrent;
          ac = m.ac;
        }
      }

      return {
        id: p.id,
        name,
        kind,
        initiative: p.initiative,
        order: p.order,
        isOut: p.isOut,
        hp,
        ac,
        feetFromPlayer: p.feetFromPlayer,
        playerId: p.playerId,
        npcId: p.npcId,
        monsterInstanceId: p.monsterInstanceId,
      };
    })
  );

  return {
    player: {
      id: player.id,
      name: player.name,
      hpMax: player.hpMax,
      hpCurrent: player.hpCurrent,
      ac: player.ac,
      speed: player.speed,
      str: player.str,
      dex: player.dex,
      con: player.con,
      int: player.int,
      wis: player.wis,
      cha: player.cha,
      proficiencyBonus: player.proficiencyBonus,
      weapons,
    },
    encounter: {
      id: encounter.id,
      round: encounter.round,
      currentTurnIndex: encounter.currentTurnIndex,
      status: encounter.status,
    },
    participants,
  };
};
