'use server';

import { loadLocationContext } from '@/services/location/loadLocationContext';
import { fillPlanStepNames } from './fillPlanStepNames';
import { buildPlanPrompt } from './buildPlanPrompt';
import type { IPlanStep } from './parsePlanReply';
import { runPlanToolLoop, type IToolCallLog } from './runPlanToolLoop';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IPlanPlayerInputParams {
  campaignId: string;
  playerId: string;
  messages: IChatMessage[];
}

export interface IPlanPlayerInputResult {
  steps: IPlanStep[];
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

export const planPlayerInput = async (input: IPlanPlayerInputParams): Promise<IPlanPlayerInputResult> => {
  const campaignId = input.campaignId.trim();
  const playerId = input.playerId.trim();
  if (!campaignId) throw new Error('campaignId обязателен.');
  if (!playerId) throw new Error('playerId обязателен.');

  const messages = parseMessages(input.messages);
  const ctx = await loadLocationContext({ campaignId, playerId });

  const { steps, toolCalls } = await runPlanToolLoop({
    system: buildPlanPrompt(ctx),
    messages,
    ctx: { campaignId, playerId },
  });

  return {
    steps: await fillPlanStepNames({ campaignId, steps }),
    toolCalls,
  };
};
