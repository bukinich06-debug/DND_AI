'use server';

import { buildCombatPrompt } from './buildCombatPrompt';
import { loadCombatAgentContext } from './loadCombatAgentContext';
import { runCombatToolLoop, type IToolCallLog } from './runCombatToolLoop';
import { checkEncounterEnd } from '@/services/encounter/checkEncounterEnd';
import { getActiveEncounter } from '@/services/encounter/getActiveEncounter';

interface IRunPlayerCombatTurnParams {
  campaignId: string;
  encounterId: string;
  playerId: string;
  playerAction: string;
}

export interface IRunPlayerCombatTurnResult {
  say: string;
  do: string | null;
  toolCalls: IToolCallLog[];
  actionRejected: boolean;
  rejectionReason: string | null;
  encounterEnded?: boolean;
  encounterResult?: {
    victory: boolean;
    outcome: 'victory' | 'captured' | 'defeat' | 'fled';
    defeated: string[];
    survivors: string[];
    defeatedMonsters: Array<{ name: string; catalogKey: string }>;
    capturedBy: string[];
  };
  encounter?: Awaited<ReturnType<typeof getActiveEncounter>>['encounter'];
}

export const runPlayerCombatTurn = async (input: IRunPlayerCombatTurnParams): Promise<IRunPlayerCombatTurnResult> => {
  if (!input.campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!input.encounterId.trim()) throw new Error('encounterId обязателен.');
  if (!input.playerId.trim()) throw new Error('playerId обязателен.');
  if (!input.playerAction.trim()) throw new Error('playerAction обязателен.');

  const ctx = await loadCombatAgentContext({
    campaignId: input.campaignId,
    encounterId: input.encounterId,
    playerId: input.playerId,
  });

  if (ctx.encounter.status !== 'active') throw new Error('Боевая сцена не активна.');

  const orderedParticipants = [...ctx.participants].sort((a, b) => a.order - b.order);
  const currentParticipant = orderedParticipants[ctx.encounter.currentTurnIndex];

  if (!currentParticipant || currentParticipant.isOut || currentParticipant.playerId !== input.playerId)
    throw new Error('NOT_PLAYER_TURN: Сейчас не ход этого игрока.');

  const system = buildCombatPrompt(ctx, input.playerAction);

  const reply = await runCombatToolLoop({
    system,
    ctx: {
      campaignId: input.campaignId,
      playerId: input.playerId,
      encounterId: input.encounterId,
    },
  });

  const analyzeRejection = (): { rejected: boolean; reason: string | null } => {
    const gameTools = ['resolve_player_attack', 'move_player_in_combat', 'use_player_consumable'];
    const gameCalls = reply.toolCalls.filter((tc) => gameTools.includes(tc.name));

    if (gameCalls.length === 0) {
      return { rejected: false, reason: null };
    }

    const hasSuccessfulGameTool = gameCalls.some((tc) => {
      if (!tc.ok) return false;
      if (typeof tc.result === 'object' && tc.result !== null && 'errorCode' in tc.result) {
        return false;
      }
      return true;
    });

    if (hasSuccessfulGameTool) {
      return { rejected: false, reason: null };
    }

    if (reply.rejection?.rejected) {
      return { rejected: true, reason: reply.rejection.reason ?? 'Действие отклонено' };
    }

    const firstError = gameCalls.find(
      (tc) => !tc.ok || (typeof tc.result === 'object' && tc.result !== null && 'errorCode' in tc.result)
    );
    if (!firstError) return { rejected: false, reason: null };

    let reason = 'Действие не выполнено';
    if (!firstError.ok && firstError.error) {
      reason = firstError.error;
    } else if (
      typeof firstError.result === 'object' &&
      firstError.result !== null &&
      'errorCode' in firstError.result
    ) {
      const errorCode = (firstError.result as { errorCode?: string }).errorCode;
      const errorMessage = (firstError.result as { message?: string }).message;
      if (errorMessage) {
        reason = errorMessage;
      } else if (errorCode === 'ACTION_ALREADY_USED') {
        reason = 'Основное действие уже использовано в этом ходу';
      } else if (errorCode === 'BONUS_ACTION_ALREADY_USED') {
        reason = 'Бонусное действие уже использовано в этом ходу';
      } else if (errorCode === 'MOVEMENT_EXCEEDED') {
        reason = 'Движение превышает остаток';
      } else if (errorCode === 'OUT_OF_REACH') {
        reason = 'Цель вне досягаемости';
      } else if (errorCode === 'UNKNOWN_WEAPON') {
        reason = 'Нет такого оружия';
      } else if (errorCode === 'WEAPON_NOT_EQUIPPED') {
        reason = 'Оружие не экипировано';
      } else if (errorCode === 'ALLIED_TARGET') {
        reason = 'Нельзя атаковать союзника';
      } else if (errorCode === 'ITEM_DEPLETED') {
        reason = 'Предмет закончился';
      } else if (errorCode === 'UNKNOWN_CONSUMABLE_EFFECT') {
        reason = 'Неизвестный эффект предмета';
      } else if (errorCode === 'TARGET_DOWN') {
        reason = 'Нельзя атаковать цель с 0 HP';
      }
    }
    return { rejected: true, reason };
  };

  const rejection = analyzeRejection();

  const endCheck = await checkEncounterEnd({ encounterId: input.encounterId });

  if (endCheck.ended) {
    const encounterState = await getActiveEncounter({
      campaignId: input.campaignId,
      playerId: input.playerId,
    });

    return {
      say: reply.say,
      do: reply.do,
      toolCalls: reply.toolCalls,
      actionRejected: rejection.rejected,
      rejectionReason: rejection.reason,
      encounterEnded: true,
      encounterResult: endCheck.result ?? undefined,
      encounter: encounterState.encounter,
    };
  }

  return {
    say: reply.say,
    do: reply.do,
    toolCalls: reply.toolCalls,
    actionRejected: rejection.rejected,
    rejectionReason: rejection.reason,
  };
};
