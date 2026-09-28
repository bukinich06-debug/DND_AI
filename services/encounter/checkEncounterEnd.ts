'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { monsterInstanceRepository } from '@/data/monster';
import { getCatalogMonsterByKey } from '@/domain/monster';
import { stabilizePlayer } from '@/services/player/deathSaves/stabilizePlayer';
import { db } from '@/data/shared';

interface ICheckEncounterEndInput {
  encounterId: string;
}

interface IEncounterResult {
  victory: boolean;
  outcome: 'victory' | 'captured' | 'defeat' | 'fled';
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

  const playerParticipant = participants.find((p) => p.playerId);
  const monsterParticipants = participants.filter((p) => p.monsterInstanceId);

  if (!playerParticipant) {
    return { ended: false, result: null };
  }

  const player = await playerRepository.getById(playerParticipant.playerId!);
  if (!player) {
    return { ended: false, result: null };
  }

  const monstersAlive = monsterParticipants.filter((p) => !p.isOut);

  if (player.dead) {
    if (!playerParticipant.isOut) {
      await encounterParticipantRepository.update(playerParticipant.id, { isOut: true });
    }

    const updateResult = await db.encounter.updateMany({
      where: {
        id: input.encounterId,
        status: 'active',
      },
      data: {
        status: 'ended',
      },
    });

    if (updateResult.count === 0) {
      return { ended: false, result: null };
    }

    const defeatedMonsters: Array<{ name: string; catalogKey: string }> = [];
    const defeated: string[] = [player.name];
    const survivors: string[] = [];

    for (const p of monsterParticipants) {
      const monster = await monsterInstanceRepository.getById(p.monsterInstanceId!);
      const name = monster?.name ?? 'Monster';

      if (p.isOut) {
        defeated.push(name);
        defeatedMonsters.push({
          name: monster?.name ?? 'Unknown Monster',
          catalogKey: monster?.catalogKey ?? 'unknown',
        });
      } else {
        survivors.push(name);
      }
    }

    const resultMessage = `Поражение. ${player.name} мёртв.`;

    await encounterLogRepository.create({
      encounterId: input.encounterId,
      actorName: null,
      message: resultMessage,
      meta: {
        victory: false,
        outcome: 'defeat',
        defeated,
        survivors,
        defeatedMonsters,
        capturedBy: [],
      },
    });

    return {
      ended: true,
      result: {
        victory: false,
        outcome: 'defeat',
        defeated,
        survivors,
        defeatedMonsters,
        capturedBy: [],
      },
    };
  }

  if (playerParticipant.isOut && player.hpCurrent > 0 && !player.dead) {
    if (monstersAlive.length === 0) {
      const updateResult = await db.encounter.updateMany({
        where: {
          id: input.encounterId,
          status: 'active',
        },
        data: {
          status: 'ended',
        },
      });

      if (updateResult.count === 0) {
        return { ended: false, result: null };
      }

      const defeatedMonsters: Array<{ name: string; catalogKey: string }> = [];
      const defeated: string[] = [];

      for (const p of monsterParticipants) {
        const monster = await monsterInstanceRepository.getById(p.monsterInstanceId!);
        const name = monster?.name ?? 'Monster';
        defeated.push(name);
        defeatedMonsters.push({
          name: monster?.name ?? 'Unknown Monster',
          catalogKey: monster?.catalogKey ?? 'unknown',
        });
      }

      const resultMessage = `${player.name} сбежал из боя. Побеждены: ${defeatedMonsters.map((m) => m.name).join(', ')}.`;

      await encounterLogRepository.create({
        encounterId: input.encounterId,
        actorName: null,
        message: resultMessage,
        meta: {
          victory: false,
          outcome: 'fled',
          defeated,
          survivors: [player.name],
          defeatedMonsters,
          capturedBy: [],
        },
      });

      return {
        ended: true,
        result: {
          victory: false,
          outcome: 'fled',
          defeated,
          survivors: [player.name],
          defeatedMonsters,
          capturedBy: [],
        },
      };
    }

    const updateResult = await db.encounter.updateMany({
      where: {
        id: input.encounterId,
        status: 'active',
      },
      data: {
        status: 'ended',
      },
    });

    if (updateResult.count === 0) {
      return { ended: false, result: null };
    }

    const defeatedMonsters: Array<{ name: string; catalogKey: string }> = [];
    const defeated: string[] = [];
    const survivors: string[] = [player.name];
    const capturedBy: string[] = [];

    for (const p of monsterParticipants) {
      const monster = await monsterInstanceRepository.getById(p.monsterInstanceId!);
      const name = monster?.name ?? 'Monster';

      if (p.isOut) {
        defeated.push(name);
        defeatedMonsters.push({
          name: monster?.name ?? 'Unknown Monster',
          catalogKey: monster?.catalogKey ?? 'unknown',
        });
      } else {
        survivors.push(name);
        capturedBy.push(name);
      }
    }

    const resultMessage = `${player.name} сбежал из боя.`;

    await encounterLogRepository.create({
      encounterId: input.encounterId,
      actorName: null,
      message: resultMessage,
      meta: {
        victory: false,
        outcome: 'fled',
        defeated,
        survivors,
        defeatedMonsters,
        capturedBy: [],
      },
    });

    return {
      ended: true,
      result: {
        victory: false,
        outcome: 'fled',
        defeated,
        survivors,
        defeatedMonsters,
        capturedBy: [],
      },
    };
  }

  if (monstersAlive.length === 0) {
    const updateResult = await db.encounter.updateMany({
      where: {
        id: input.encounterId,
        status: 'active',
      },
      data: {
        status: 'ended',
      },
    });

    if (updateResult.count === 0) {
      return { ended: false, result: null };
    }

    const defeatedMonsters: Array<{ name: string; catalogKey: string }> = [];
    const defeated: string[] = [];

    for (const p of monsterParticipants) {
      const monster = await monsterInstanceRepository.getById(p.monsterInstanceId!);
      const name = monster?.name ?? 'Monster';
      defeated.push(name);
      defeatedMonsters.push({
        name: monster?.name ?? 'Unknown Monster',
        catalogKey: monster?.catalogKey ?? 'unknown',
      });
    }

    const resultMessage = `Победа! Побеждены: ${defeatedMonsters.map((m) => m.name).join(', ')}.`;

    await encounterLogRepository.create({
      encounterId: input.encounterId,
      actorName: null,
      message: resultMessage,
      meta: {
        victory: true,
        outcome: 'victory',
        defeated,
        survivors: [player.name],
        defeatedMonsters,
        capturedBy: [],
      },
    });

    return {
      ended: true,
      result: {
        victory: true,
        outcome: 'victory',
        defeated,
        survivors: [player.name],
        defeatedMonsters,
        capturedBy: [],
      },
    };
  }

  if (player.hpCurrent === 0 && !player.dead && !player.isStable) {
    return { ended: false, result: null };
  }

  if (player.hpCurrent === 0 && player.isStable && monstersAlive.length > 0) {
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
      const updateResult = await db.encounter.updateMany({
        where: {
          id: input.encounterId,
          status: 'active',
        },
        data: {
          status: 'ended',
        },
      });

      if (updateResult.count === 0) {
        return { ended: false, result: null };
      }

      const capturedBy = monsterDetails.filter((m) => m).map((m) => m!.name);
      const defeatedMonsters: Array<{ name: string; catalogKey: string }> = [];
      const defeated: string[] = [];
      const survivors: string[] = [player.name];

      for (const p of monsterParticipants) {
        const monster = await monsterInstanceRepository.getById(p.monsterInstanceId!);
        const name = monster?.name ?? 'Monster';

        if (p.isOut) {
          defeated.push(name);
          defeatedMonsters.push({
            name: monster?.name ?? 'Unknown Monster',
            catalogKey: monster?.catalogKey ?? 'unknown',
          });
        } else {
          survivors.push(name);
        }
      }

      await stabilizePlayer({
        playerId: player.id,
        restoreHp: 1,
        removeUnconscious: false,
      });

      const resultMessage = `${player.name} выведен из строя и захвачен противниками: ${capturedBy.join(', ')}.`;

      await encounterLogRepository.create({
        encounterId: input.encounterId,
        actorName: null,
        message: resultMessage,
        meta: {
          victory: false,
          outcome: 'captured',
          defeated,
          survivors,
          defeatedMonsters,
          capturedBy,
        },
      });

      return {
        ended: true,
        result: {
          victory: false,
          outcome: 'captured',
          defeated,
          survivors,
          defeatedMonsters,
          capturedBy,
        },
      };
    }
  }

  return { ended: false, result: null };
};
