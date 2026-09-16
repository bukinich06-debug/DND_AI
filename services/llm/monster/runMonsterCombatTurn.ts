'use server';

import { buildMonsterPrompt } from './buildMonsterPrompt';
import { loadMonsterCombatContext } from './loadMonsterCombatContext';
import { runMonsterToolLoop, type IToolCallLog } from './runMonsterToolLoop';

interface IRunMonsterCombatTurnParams {
  campaignId: string;
  encounterId: string;
  monsterInstanceId: string;
}

export interface IRunMonsterCombatTurnResult {
  say: string;
  do: string | null;
  toolCalls: IToolCallLog[];
}

export const runMonsterCombatTurn = async (
  input: IRunMonsterCombatTurnParams
): Promise<IRunMonsterCombatTurnResult> => {
  if (!input.campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!input.encounterId.trim()) throw new Error('encounterId обязателен.');
  if (!input.monsterInstanceId.trim()) throw new Error('monsterInstanceId обязателен.');

  const ctx = await loadMonsterCombatContext({
    campaignId: input.campaignId,
    encounterId: input.encounterId,
    monsterInstanceId: input.monsterInstanceId,
  });

  const system = buildMonsterPrompt(ctx);

  const reply = await runMonsterToolLoop({
    system,
    ctx: {
      campaignId: input.campaignId,
    },
  });

  return {
    say: reply.say,
    do: reply.do,
    toolCalls: reply.toolCalls,
  };
};
