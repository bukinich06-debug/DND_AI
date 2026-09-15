'use server';

import { formatCheckOutcome, type ICheckOutcome } from '@/services/llm/check/formatCheckOutcome';
import { buildMasterPrompt } from './buildMasterPrompt';
import { loadMasterContext } from './loadMasterContext';
import { runMasterToolLoop, type IToolCallLog } from './runMasterToolLoop';
import type { IRequestedCheck } from '@/services/llm/check/parseRequestedCheck';
import type { MasterVerdict } from './parseMasterReply';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IAdjudicatePlayerActionParams {
  campaignId: string;
  playerId: string;
  messages: IChatMessage[];
  checkOutcome?: ICheckOutcome;
}

export interface IAdjudicatePlayerActionResult {
  verdict: MasterVerdict;
  say: string;
  check: IRequestedCheck | null;
  toolCalls: IToolCallLog[];
}

const parseMessages = (messages: unknown): IChatMessage[] => {
  if (!Array.isArray(messages)) throw new Error('messages должен быть массивом.');
  if (messages.length === 0) throw new Error('messages не должен быть пустым.');

  return messages.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`messages[${index}] некорректен.`);
    const raw = item as Record<string, unknown>;
    if (raw.role !== 'user' && raw.role !== 'assistant')
      throw new Error(`messages[${index}].role должен быть user или assistant.`);
    if (typeof raw.content !== 'string' || !raw.content.trim())
      throw new Error(`messages[${index}].content обязателен.`);
    return { role: raw.role, content: raw.content.trim() };
  });
};

export const adjudicatePlayerAction = async (
  input: IAdjudicatePlayerActionParams
): Promise<IAdjudicatePlayerActionResult> => {
  const campaignId = input.campaignId.trim();
  const playerId = input.playerId.trim();
  if (!campaignId) throw new Error('campaignId обязателен.');
  if (!playerId) throw new Error('playerId обязателен.');

  const messages = parseMessages(input.messages);
  const ctx = await loadMasterContext({ campaignId, playerId });
  const outcome = input.checkOutcome;
  const system = outcome
    ? `${buildMasterPrompt(ctx)}\n\n## Результат проверки игрока\n${formatCheckOutcome(outcome)}`
    : buildMasterPrompt(ctx);
  const reply = await runMasterToolLoop({
    system,
    messages,
    ctx: {
      campaignId,
      playerId,
      passedCheck: outcome
        ? { skill: outcome.skill, knowledgeId: outcome.knowledgeId, passed: outcome.passed }
        : undefined,
    },
  });

  if (outcome && reply.check)
    return {
      verdict: reply.verdict === 'check' ? 'partial' : reply.verdict,
      say: reply.say,
      check: null,
      toolCalls: reply.toolCalls,
    };

  return { verdict: reply.verdict, say: reply.say, check: reply.check, toolCalls: reply.toolCalls };
};
