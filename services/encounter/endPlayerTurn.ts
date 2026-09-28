'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { advanceCombatTurn } from './advanceCombatTurn';
import type { IAdvanceCombatTurnResult } from './advanceCombatTurn';

interface IEndPlayerTurnInput {
  campaignId: string;
  playerId: string;
}

type IEndPlayerTurnResult = IAdvanceCombatTurnResult;

export const endPlayerTurn = async (input: IEndPlayerTurnInput): Promise<IEndPlayerTurnResult> => {
  const encounter = await encounterRepository.getActiveByCampaignId(input.campaignId);

  if (!encounter) {
    return {
      success: false,
      error: 'Активная боевая сцена не найдена.',
      errorCode: 'NO_ACTIVE_ENCOUNTER',
      encounter: null,
      newLogEntries: [],
    };
  }

  const participants = await encounterParticipantRepository.listByEncounterId(encounter.id);

  if (participants.length === 0) {
    return {
      success: false,
      error: 'Нет участников боя.',
      errorCode: 'NO_PARTICIPANTS',
      encounter: null,
      newLogEntries: [],
    };
  }

  const currentParticipant = participants[encounter.currentTurnIndex];

  if (!currentParticipant) {
    return {
      success: false,
      error: 'Текущий участник не найден.',
      errorCode: 'CURRENT_PARTICIPANT_NOT_FOUND',
      encounter: null,
      newLogEntries: [],
    };
  }

  if (currentParticipant.playerId !== input.playerId) {
    return {
      success: false,
      error: 'Сейчас не ваш ход.',
      errorCode: 'NOT_PLAYER_TURN',
      encounter: null,
      newLogEntries: [],
    };
  }

  await encounterLogRepository.create({
    encounterId: encounter.id,
    actorName: null,
    message: 'Игрок завершил свой ход.',
  });

  const result = await advanceCombatTurn({
    campaignId: input.campaignId,
    playerId: input.playerId,
    playerEndedTurn: true,
  });

  return result;
};
