'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { monsterInstanceRepository } from '@/data/monster';
import { getCatalogMonsterByKey, crToXp } from '@/domain/monster';

interface ICheckEncounterEndInput {
  encounterId: string;
}

interface IEncounterResult {
  victory: boolean;
  defeated: string[];
  survivors: string[];
  xpGained: number;
  coinsGained: number;
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

  const playersAlive = playerSide.filter((p) => !p.isOut);
  const monstersAlive = monsterSide.filter((p) => !p.isOut);

  if (playersAlive.length > 0 && monstersAlive.length > 0) {
    return { ended: false, result: null };
  }

  const victory = playersAlive.length > 0;

  const defeated: string[] = [];
  const survivors: string[] = [];

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
    }

    if (p.isOut) {
      defeated.push(name);
    } else {
      survivors.push(name);
    }
  }

  let xpGained = 0;
  let coinsGained = 0;

  if (victory) {
    for (const m of monsterSide) {
      if (!m.monsterInstanceId) continue;

      const monster = await monsterInstanceRepository.getById(m.monsterInstanceId);
      if (!monster) continue;

      const catalog = getCatalogMonsterByKey(monster.catalogKey);
      if (!catalog) continue;

      xpGained += crToXp(catalog.challengeRating);
      coinsGained += catalog.lootCoinsCp;
    }

    for (const p of playersAlive) {
      if (!p.playerId) continue;
      const player = await playerRepository.getById(p.playerId);
      if (!player) continue;

      await playerRepository.update(p.playerId, {
        xp: (player.xp ?? 0) + xpGained,
        coinsCp: player.coinsCp + coinsGained,
      });
    }
  }

  await encounterRepository.update(input.encounterId, {
    status: 'ended',
  });

  const resultMessage = victory
    ? `Победа! Получено ${xpGained} XP и ${coinsGained} медных монет.`
    : `Поражение. Все игроки выбыли из боя.`;

  await encounterLogRepository.create({
    encounterId: input.encounterId,
    actorName: null,
    message: resultMessage,
    meta: { victory, xpGained, coinsGained, defeated, survivors },
  });

  return {
    ended: true,
    result: {
      victory,
      defeated,
      survivors,
      xpGained,
      coinsGained,
    },
  };
};
