'use server';

import { formatCheckOutcome, type ICheckOutcome } from '@/services/llm/check/formatCheckOutcome';
import type { IRequestedCheck } from '@/services/llm/check/parseRequestedCheck';
import { resolveMentionedLocationsHook } from '@/services/llm/hooks/location/resolveMentionedLocations';
import { resolveMentionedNpcsHook } from '@/services/llm/hooks/npc/resolveMentionedNpcs';
import { runAfterAgent } from '@/services/llm/hooks/runAfterAgent';
import { waitForHooks } from '@/services/llm/hooks/store/hookLock';
import { createTurn } from '@/services/llm/hooks/store/hookLogStore';
import { chatHookKey } from '@/services/llm/hooks/types';
import { buildNpcPrompt } from './buildNpcPrompt';
import { loadNpcChatContext } from './loadNpcChatContext';
import { runNpcToolLoop, type IToolCallLog } from './runNpcToolLoop';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IChatWithNpcParams {
  campaignId: string;
  npcId: string;
  playerId: string;
  messages: IChatMessage[];
  checkOutcome?: ICheckOutcome;
  arrivalTitle?: string;
}

export interface IChatWithNpcResult {
  say: string;
  do: string | null;
  check: IRequestedCheck | null;
  toolCalls: IToolCallLog[];
  turnId: string;
  openShop?: { specialtyKey: string };
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

const formatNpcAfterCheck = (outcome: ICheckOutcome) => {
  if (!outcome.knowledgeId)
    return 'Не проси новую проверку. Не возвращай поле check. Не вызывай get_coins и transfer_coins — сейчас не платёж.';
  if (outcome.passed)
    return `Секрет knowledgeId=${outcome.knowledgeId} открыт: в снимке «Секреты под проверкой» у этой записи есть content. Скажи эти факты в say (можно своими словами, смысл тот же). Не отказывай, не требуй денег за секрет, не обрывай разговор. Не вызывай get_coins, transfer_coins, list_npc_knowledge. Не возвращай поле check.`;
  return `Секрет knowledgeId=${outcome.knowledgeId} не открыт. Не называй content, даже намёком. Можно отказать. Не вызывай get_coins. Не возвращай поле check.`;
};

const NPC_HOOKS = [resolveMentionedLocationsHook, resolveMentionedNpcsHook];

export const chatWithNpc = async (input: IChatWithNpcParams): Promise<IChatWithNpcResult> => {
  const messages = parseMessages(input.messages);
  const chatKey = chatHookKey(input.campaignId, input.npcId, input.playerId);
  await waitForHooks(chatKey);

  const outcome = input.checkOutcome;
  const passedCheck = outcome
    ? { skill: outcome.skill, knowledgeId: outcome.knowledgeId, passed: outcome.passed }
    : undefined;
  const chatCtx = await loadNpcChatContext({
    campaignId: input.campaignId,
    npcId: input.npcId,
    playerId: input.playerId,
    passedCheck,
    arrivalTitle: input.arrivalTitle,
  });
  const systemBase = buildNpcPrompt(chatCtx);
  const system = outcome
    ? `${systemBase}\n\n## Результат проверки игрока\n${formatCheckOutcome(outcome)}\n${formatNpcAfterCheck(outcome)}`
    : systemBase;
  const reply = await runNpcToolLoop({
    system,
    messages,
    ctx: {
      campaignId: input.campaignId,
      npcId: input.npcId,
      playerId: input.playerId,
      passedCheck,
    },
  });

  let out = outcome && reply.check ? { ...reply, check: null } : reply;
  if (!outcome && out.check) out = { ...out, say: '', do: null };

  const turnId = createTurn(
    chatKey,
    NPC_HOOKS.map((h) => h.name)
  );

  runAfterAgent({
    chatKey,
    turnId,
    hooks: NPC_HOOKS,
    ctx: {
      campaignId: input.campaignId,
      npcId: input.npcId,
      playerId: input.playerId,
      reply: { say: out.say, do: out.do },
      messages,
      speakerName: chatCtx.npc.name,
      playerName: chatCtx.player.name,
      source: 'npc',
    },
  });

  return { ...out, check: out.check ?? null, turnId, openShop: out.openShop };
};
