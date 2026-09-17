'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository } from '@/data/npc';
import { runMonsterCombatTurn } from '@/services/llm/monster/runMonsterCombatTurn';
import { getActiveEncounter } from './getActiveEncounter';

interface IAdvanceCombatTurnInput {
  campaignId: string;
  playerId?: string;
}

interface ILogEntry {
  actorName: string | null;
  message: string;
  meta?: unknown;
}

interface IAdvanceCombatTurnResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  encounter: Awaited<ReturnType<typeof getActiveEncounter>>['encounter'];
  newLogEntries: ILogEntry[];
}

export const advanceCombatTurn = async (input: IAdvanceCombatTurnInput): Promise<IAdvanceCombatTurnResult> => {
  const encounter = await encounterRepository.getActiveByCampaignId(input.campaignId);

  if (!encounter) {
    return {
      success: false,
      error: 'Активная боевая сцена не найдена.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const participants = await encounterParticipantRepository.listByEncounterId(encounter.id);

  if (participants.length === 0) {
    return {
      success: false,
      error: 'Нет участников боя.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const activeParticipants = participants.filter((p) => !p.isOut);

  if (activeParticipants.length === 0) {
    return {
      success: false,
      error: 'Все участники выведены из боя.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const currentParticipant = participants[encounter.currentTurnIndex];

  if (!currentParticipant) {
    return {
      success: false,
      error: 'Текущий участник не найден.',
      encounter: null,
      newLogEntries: [],
    };
  }

  if (currentParticipant.isOut) {
    return {
      success: false,
      error: 'Текущий участник выведен из боя.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const newLogEntries: ILogEntry[] = [];

  if (currentParticipant.playerId) {
    return {
      success: false,
      error: 'Сейчас ход игрока. Ход не был продвинут.',
      errorCode: 'PLAYER_TURN',
      encounter: null,
      newLogEntries: [],
    };
  } else if (currentParticipant.monsterInstanceId) {
    const monsterResult = await runMonsterCombatTurn({
      campaignId: input.campaignId,
      encounterId: encounter.id,
      monsterInstanceId: currentParticipant.monsterInstanceId,
    });

    const monsterInstance = await monsterInstanceRepository.getById(currentParticipant.monsterInstanceId);
    const actorName = monsterInstance?.name ?? 'Монстр';

    if (monsterResult.say) {
      const sayEntry = {
        actorName,
        message: `Говорит: ${monsterResult.say}`,
      };
      await encounterLogRepository.create({
        encounterId: encounter.id,
        ...sayEntry,
      });
      newLogEntries.push(sayEntry);
    }

    if (monsterResult.do) {
      const doEntry = {
        actorName,
        message: `Действует: ${monsterResult.do}`,
      };
      await encounterLogRepository.create({
        encounterId: encounter.id,
        ...doEntry,
      });
      newLogEntries.push(doEntry);
    }

    const moveResults = monsterResult.toolCalls.filter((tc) => tc.name === 'move_in_combat' && tc.result);

    for (const move of moveResults) {
      if (typeof move.result === 'object' && move.result !== null) {
        const res = move.result as {
          movedFeet?: number;
          feetFromPlayerBefore?: number;
          feetFromPlayerAfter?: number;
          monsterName?: string;
        };

        if (res.movedFeet && res.movedFeet > 0) {
          const moveEntry = {
            actorName,
            message: `${res.monsterName || actorName} приближается на ${res.movedFeet} фт (осталось ${res.feetFromPlayerAfter} фт до игрока)`,
            meta: move.result,
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...moveEntry,
          });
          newLogEntries.push(moveEntry);
        }
      }
    }

    const attackResults = monsterResult.toolCalls.filter((tc) => tc.name === 'resolve_monster_attack' && tc.result);

    for (const attack of attackResults) {
      if (typeof attack.result === 'object' && attack.result !== null) {
        const res = attack.result as {
          hit?: boolean;
          damageTotal?: number;
          targetName?: string;
          attackRoll?: number;
          attackBonus?: number;
          attackTotal?: number;
          targetAc?: number;
          damageRolls?: number[];
          damageBonus?: number;
          targetPreviousHp?: number;
          targetNewHp?: number;
          errorCode?: string;
        };

        if (res.errorCode === 'OUT_OF_REACH') {
          const attackEntry = {
            actorName,
            message: `Атака невозможна: ${res.targetName || 'цель'} слишком далеко`,
            meta: attack.result,
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...attackEntry,
          });
          newLogEntries.push(attackEntry);
        } else if (res.hit && res.damageTotal !== undefined) {
          const attackDetails =
            res.attackRoll !== undefined && res.attackBonus !== undefined && res.targetAc !== undefined
              ? `d20 ${res.attackRoll}+${res.attackBonus}=${res.attackTotal} vs AC ${res.targetAc}, `
              : '';

          const damageDetails =
            res.damageRolls && res.damageBonus !== undefined
              ? `${res.damageRolls.join('+')}${res.damageBonus >= 0 ? '+' : ''}${res.damageBonus} → ${res.damageTotal}`
              : `${res.damageTotal}`;

          const hpDetails =
            res.targetPreviousHp !== undefined && res.targetNewHp !== undefined
              ? ` (HP ${res.targetPreviousHp}→${res.targetNewHp})`
              : '';

          const attackEntry = {
            actorName,
            message: `Попадание по ${res.targetName || 'цель'}: ${attackDetails}урон ${damageDetails}${hpDetails}`,
            meta: attack.result,
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...attackEntry,
          });
          newLogEntries.push(attackEntry);
        } else if (res.hit === false) {
          const attackDetails =
            res.attackRoll !== undefined && res.attackBonus !== undefined && res.targetAc !== undefined
              ? ` (d20 ${res.attackRoll}+${res.attackBonus}=${res.attackTotal} vs AC ${res.targetAc})`
              : '';

          const attackEntry = {
            actorName,
            message: `Атака по ${res.targetName || 'цели'} промахнулась${attackDetails}`,
            meta: attack.result,
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...attackEntry,
          });
          newLogEntries.push(attackEntry);
        }
      }
    }
  } else if (currentParticipant.npcId) {
    const npc = await npcRepository.getById(currentParticipant.npcId);
    const npcName = npc?.name ?? 'NPC';

    const skipEntry = {
      actorName: npcName,
      message: 'Ход NPC пропущен (не реализован).',
    };
    await encounterLogRepository.create({
      encounterId: encounter.id,
      ...skipEntry,
    });
    newLogEntries.push(skipEntry);
  }

  let nextTurnIndex = encounter.currentTurnIndex + 1;
  let nextRound = encounter.round;

  while (nextTurnIndex < participants.length && participants[nextTurnIndex].isOut) {
    nextTurnIndex++;
  }

  if (nextTurnIndex >= participants.length) {
    nextRound++;
    nextTurnIndex = 0;

    while (nextTurnIndex < participants.length && participants[nextTurnIndex].isOut) {
      nextTurnIndex++;
    }
  }

  await encounterRepository.update(encounter.id, {
    currentTurnIndex: nextTurnIndex,
    round: nextRound,
  });

  const updatedEncounter = await getActiveEncounter({
    campaignId: input.campaignId,
    playerId: input.playerId,
  });

  return {
    success: true,
    encounter: updatedEncounter.encounter,
    newLogEntries,
  };
};
