import { getCatalogMonsterByKey } from '@/domain/monster/catalog';
import type { IMonsterAction, IMonsterAbility } from '@/domain/monster/catalog/types';
import { encounterRepository, encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';

const normalizeToArray = <T>(value: T[] | null | undefined | object): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
};

interface ILoadMonsterCombatContextParams {
  campaignId: string;
  encounterId: string;
  monsterInstanceId: string;
}

export interface IMonsterCombatContext {
  monster: {
    id: string;
    name: string;
    catalogKey: string;
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
    traits: IMonsterAbility[] | null;
    actions: IMonsterAction[] | null;
  };
  encounter: {
    id: string;
    round: number;
    currentTurnIndex: number;
  };
  participants: Array<{
    id: string;
    name: string;
    kind: 'player' | 'npc' | 'monster';
    initiative: number;
    order: number;
    isOut: boolean;
    hp: number | null;
    playerId: string | null;
    npcId: string | null;
    monsterInstanceId: string | null;
  }>;
}

export const loadMonsterCombatContext = async ({
  campaignId,
  encounterId,
  monsterInstanceId,
}: ILoadMonsterCombatContextParams): Promise<IMonsterCombatContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!encounterId.trim()) throw new Error('encounterId обязателен.');
  if (!monsterInstanceId.trim()) throw new Error('monsterInstanceId обязателен.');

  const monster = await monsterInstanceRepository.getById(monsterInstanceId);
  if (!monster) throw new Error('Экземпляр монстра не найден.');
  if (monster.campaignId !== campaignId) throw new Error('Монстр не принадлежит этой кампании.');

  const encounter = await encounterRepository.getById(encounterId);
  if (!encounter) throw new Error('Боевая сцена не найдена.');
  if (encounter.campaignId !== campaignId) throw new Error('Боевая сцена не принадлежит этой кампании.');

  let catalogActions: IMonsterAction[] | null = null;
  let catalogTraits: IMonsterAbility[] | null = null;
  try {
    const catalogEntry = getCatalogMonsterByKey(monster.catalogKey);
    catalogActions = normalizeToArray(catalogEntry.actions);
    catalogTraits = normalizeToArray(catalogEntry.traits);
  } catch {
    // Справочная запись отсутствует — продолжаем без неё
  }

  const rawParticipants = await encounterParticipantRepository.listByEncounterId(encounterId);

  const participants = await Promise.all(
    rawParticipants.map(async (p) => {
      let name = 'Неизвестный';
      let kind: 'player' | 'npc' | 'monster' = 'monster';
      let hp: number | null = null;

      if (p.playerId) {
        const player = await playerRepository.getById(p.playerId);
        if (player) {
          name = player.name;
          kind = 'player';
          hp = player.hpCurrent;
        }
      } else if (p.npcId) {
        const npc = await npcRepository.getById(p.npcId);
        if (npc) {
          name = npc.name;
          kind = 'npc';
          const statBlock = await npcStatBlockRepository.getByNpcId(p.npcId);
          hp = statBlock?.hpCurrent ?? null;
        }
      } else if (p.monsterInstanceId) {
        const m = await monsterInstanceRepository.getById(p.monsterInstanceId);
        if (m) {
          name = m.name;
          kind = 'monster';
          hp = m.hpCurrent;
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
        playerId: p.playerId,
        npcId: p.npcId,
        monsterInstanceId: p.monsterInstanceId,
      };
    })
  );

  return {
    monster: {
      id: monster.id,
      name: monster.name,
      catalogKey: monster.catalogKey,
      hpMax: monster.hpMax,
      hpCurrent: monster.hpCurrent,
      ac: monster.ac,
      speed: monster.speed,
      str: monster.str,
      dex: monster.dex,
      con: monster.con,
      int: monster.int,
      wis: monster.wis,
      cha: monster.cha,
      traits: catalogTraits,
      actions: catalogActions,
    },
    encounter: {
      id: encounter.id,
      round: encounter.round,
      currentTurnIndex: encounter.currentTurnIndex,
    },
    participants,
  };
};
