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
      encounterEnded: true,
      encounterResult: endCheck.result ?? undefined,
      encounter: encounterState.encounter,
    };
  }

  return {
    say: reply.say,
    do: reply.do,
    toolCalls: reply.toolCalls,
  };
};
