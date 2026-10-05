'use server';

import { encounterParticipantRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { monsterInstanceRepository } from '@/data/monster';
import { npcStatBlockRepository } from '@/data/npc';
import { db } from '@/data/shared';
import { CombatFlag } from '@/domain/combat';

export type ActionKind = 'action' | 'bonus' | 'reaction';

interface ISpendActionResult {
  success: boolean;
  errorCode?: 'ACTION_ALREADY_USED' | 'BONUS_ACTION_ALREADY_USED' | 'REACTION_ALREADY_USED';
}

export const spendAction = async (participantId: string, kind: ActionKind): Promise<ISpendActionResult> => {
  const fieldMap = {
    action: 'actionUsed',
    bonus: 'bonusActionUsed',
    reaction: 'reactionUsed',
  } as const;

  const errorCodeMap = {
    action: 'ACTION_ALREADY_USED',
    bonus: 'BONUS_ACTION_ALREADY_USED',
    reaction: 'REACTION_ALREADY_USED',
  } as const;

  const field = fieldMap[kind];
  const errorCode = errorCodeMap[kind];

  const result = await db.encounterParticipant.updateMany({
    where: {
      id: participantId,
      [field]: false,
    },
    data: {
      [field]: true,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      errorCode,
    };
  }

  return { success: true };
};

interface ISpendMovementResult {
  success: boolean;
  errorCode?: 'MOVEMENT_EXCEEDED';
  movementLeft?: number;
}

export const spendMovement = async (
  participantId: string,
  feet: number,
  speed: number
): Promise<ISpendMovementResult> => {
  if (feet < 0) throw new Error('feet не может быть отрицательным.');
  if (!Number.isInteger(feet)) throw new Error('feet должен быть целым числом.');

  const participant = await encounterParticipantRepository.getById(participantId);
  if (!participant) throw new Error('Участник не найден.');

  const newTotal = participant.movementUsedFeet + feet;

  if (newTotal > speed) {
    return {
      success: false,
      errorCode: 'MOVEMENT_EXCEEDED',
      movementLeft: speed - participant.movementUsedFeet,
    };
  }

  const result = await db.encounterParticipant.updateMany({
    where: {
      id: participantId,
      movementUsedFeet: participant.movementUsedFeet,
    },
    data: {
      movementUsedFeet: newTotal,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      errorCode: 'MOVEMENT_EXCEEDED',
      movementLeft: 0,
    };
  }

  return { success: true };
};

interface IActionEconomyState {
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  movementUsedFeet: number;
  speed: number;
  movementLeftFeet: number;
}

export const getActionEconomy = async (participantId: string): Promise<IActionEconomyState> => {
  const participant = await encounterParticipantRepository.getById(participantId);
  if (!participant) throw new Error('Участник не найден.');

  let speed = 30;

  if (participant.playerId) {
    const player = await playerRepository.getById(participant.playerId);
    if (player) speed = player.speed;
  } else if (participant.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(participant.monsterInstanceId);
    if (monster) speed = monster.speed;
  } else if (participant.npcId) {
    const statBlock = await npcStatBlockRepository.getByNpcId(participant.npcId);
    if (statBlock) speed = statBlock.speed;
  }

  return {
    actionUsed: participant.actionUsed,
    bonusActionUsed: participant.bonusActionUsed,
    reactionUsed: participant.reactionUsed,
    movementUsedFeet: participant.movementUsedFeet,
    speed,
    movementLeftFeet: Math.max(0, speed - participant.movementUsedFeet),
  };
};

export const resetActionEconomy = async (participantId: string): Promise<void> => {
  await encounterParticipantRepository.update(participantId, {
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    movementUsedFeet: 0,
  });

  const participant = await encounterParticipantRepository.getById(participantId);
  if (!participant?.monsterInstanceId) return;

  const monster = await monsterInstanceRepository.getById(participant.monsterInstanceId);
  if (!monster) return;

  const next = monster.conditions.filter((c) => c.toLowerCase() !== CombatFlag.disengaged);
  if (next.length === monster.conditions.length) return;
  await monsterInstanceRepository.update(monster.id, { conditions: next });
};
