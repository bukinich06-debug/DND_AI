'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { monsterInstanceRepository } from '@/data/monster';
import { getCatalogMonsterByKey } from '@/domain/monster';
import { stabilizePlayer } from '@/services/player/deathSaves/stabilizePlayer';

interface ICheckEncounterEndInput {
  encounterId: string;
}

interface IEncounterResult {
  victory: boolean;
  outcome: 'victory' | 'captured' | 'defeat';
  defeated: string[];
  survivors: string[];
  defeatedMonsters: Array<{ name: string; catalogKey: string }>;
  capturedBy: string[];
}

interface ICheckEncounterEndResult {
  ended: boolean;
  result: IEncounterResult | null;
}

export const checkEncounterEnd = async (input: ICheckEncounterEndInput): Promise<ICheckEncounterEndResult> => {
  const encounter = await encounterRepository.getById(input.encounterId);

  if (!encounter || encounter.status !== 'active') {
    return { ended: false, result: null };
  }

  const participants = await encounterParticipantRepository.listByEncounterId(input.encounterId);

  const playerSide = participants.filter((p) => p.playerId || (p.npcId && p.npcId));
  const monsterSide = participants.filter((p) => p.monsterInstanceId);

  const playersAlive: typeof participants = [];
  for (const p of playerSide) {
    if (p.playerId) {
      const player = await playerRepository.getById(p.playerId);
      if (player && player.hpCurrent > 0 && !player.dead) {
        playersAlive.push(p);
      }
    } else if (p.npcId && !p.isOut) {
      playersAlive.push(p);
    }
  }

  const monstersAlive = monsterSide.filter((p) => !p.isOut);

  if (playersAlive.length > 0 && monstersAlive.length > 0) {
    return { ended: false, result: null };
  }

  let victory = false;
  let outcome: 'victory' | 'captured' | 'defeat' = 'defeat';
  const capturedBy: string[] = [];

  if (playersAlive.length > 0) {
    victory = true;
    outcome = 'victory';
  } else {
    const allPlayersDead = await Promise.all(
      playerSide
        .filter((p) => p.playerId)
        .map(async (p) => {
          const player = await playerRepository.getById(p.playerId!);
          return player?.dead ?? false;
        })
    );

    const anyPlayerAlive = !allPlayersDead.every((d) => d);

    if (anyPlayerAlive && monstersAlive.length === 0) {
      outcome = 'victory';
      victory = true;
    } else if (anyPlayerAlive) {
      const monsterDetails = await Promise.all(
        monstersAlive.map(async (p) => {
          const monster = await monsterInstanceRepository.getById(p.monsterInstanceId!);
          if (!monster) return null;
          const catalog = getCatalogMonsterByKey(monster.catalogKey);
          return { name: monster.name, finishes: catalog?.finishesDowned ?? false };
        })
      );

      const finishingMonsters = monsterDetails.filter((m) => m && m.finishes);

      if (finishingMonsters.length === 0) {
        outcome = 'captured';
        victory = false;

        for (const detail of monsterDetails) {
          if (detail) capturedBy.push(detail.name);
        }

        for (const p of playerSide) {
          if (p.playerId) {
            const player = await playerRepository.getById(p.playerId);
            if (player && !player.dead) {
              await stabilizePlayer({
                playerId: p.playerId,
                restoreHp: 1,
                removeUnconscious: false,
              });
            }
          }
        }
      } else {
        outcome = 'defeat';
        victory = false;
      }
    } else {
      outcome = 'defeat';
      victory = false;
    }
  }

  const defeated: string[] = [];
  const survivors: string[] = [];
  const defeatedMonsters: Array<{ name: string; catalogKey: string }> = [];

  for (const p of participants) {
    let name = 'Unknown';
    if (p.playerId) {
      const player = await playerRepository.getById(p.playerId);
      name = player?.name ?? 'Player';
    } else if (p.npcId) {
      const { npcRepository } = await import('@/data/npc');
      const npc = await npcRepository.getById(p.npcId);
      name = npc?.name ?? 'NPC';
    } else if (p.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(p.monsterInstanceId);
      name = monster?.name ?? 'Monster';

      if (p.isOut) {
        defeatedMonsters.push({
          name: monster?.name ?? 'Unknown Monster',
          catalogKey: monster?.catalogKey ?? 'unknown',
        });
      }
    }

    if (p.isOut) {
      defeated.push(name);
    } else {
      survivors.push(name);
    }
  }

  await encounterRepository.update(input.encounterId, {
    status: 'ended',
  });

  let resultMessage = '';
  if (outcome === 'victory') {
    resultMessage = `Победа! Побеждены: ${defeatedMonsters.map((m) => m.name).join(', ')}.`;
  } else if (outcome === 'captured') {
    resultMessage = `Все игроки выведены из строя. Захвачены противниками: ${capturedBy.join(', ')}.`;
  } else {
    resultMessage = `Поражение. Все игроки мертвы.`;
  }

  await encounterLogRepository.create({
    encounterId: input.encounterId,
    actorName: null,
    message: resultMessage,
    meta: { victory, outcome, defeated, survivors, defeatedMonsters, capturedBy },
  });

  return {
    ended: true,
    result: {
      victory,
      outcome,
      defeated,
      survivors,
      defeatedMonsters,
      capturedBy,
    },
  };
};
