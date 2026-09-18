'use server';

import { buildCombatPrompt } from './buildCombatPrompt';
import { loadCombatAgentContext } from './loadCombatAgentContext';
import { runCombatToolLoop, type IToolCallLog } from './runCombatToolLoop';

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
}

export const runPlayerCombatTurn = async (
  input: IRunPlayerCombatTurnParams
): Promise<IRunPlayerCombatTurnResult> => {
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

  const currentParticipant = ctx.participants
    .filter((p) => !p.isOut)
    .sort((a, b) => a.order - b.order)[ctx.encounter.currentTurnIndex];

  if (!currentParticipant || currentParticipant.playerId !== input.playerId)
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

  return {
    say: reply.say,
    do: reply.do,
    toolCalls: reply.toolCalls,
  };
};
