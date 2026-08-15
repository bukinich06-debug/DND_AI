'use server';

import { buildNpcPrompt } from './buildNpcPrompt';
import { loadNpcChatContext } from './loadNpcChatContext';
import { runNpcToolLoop, type IToolCallLog } from './runNpcToolLoop';
import { chatHookKey } from '@/services/llm/hooks/types';
import { waitForHooks } from '@/services/llm/hooks/store/hookLock';
import { createTurn } from '@/services/llm/hooks/store/hookLogStore';
import { runAfterAgent } from '@/services/llm/hooks/runAfterAgent';
import { resolveMentionedLocationsHook } from '@/services/llm/hooks/location/resolveMentionedLocations';
import { resolveMentionedNpcsHook } from '@/services/llm/hooks/npc/resolveMentionedNpcs';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IChatWithNpcParams {
  campaignId: string;
  npcId: string;
  playerId: string;
  messages: IChatMessage[];
}

export interface IChatWithNpcResult {
  say: string;
  do: string | null;
  toolCalls: IToolCallLog[];
  turnId: string;
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

const NPC_HOOKS = [resolveMentionedLocationsHook, resolveMentionedNpcsHook];

export const chatWithNpc = async (input: IChatWithNpcParams): Promise<IChatWithNpcResult> => {
  const messages = parseMessages(input.messages);
  const chatKey = chatHookKey(input.campaignId, input.npcId, input.playerId);
  await waitForHooks(chatKey);

  const chatCtx = await loadNpcChatContext({
    campaignId: input.campaignId,
    npcId: input.npcId,
    playerId: input.playerId,
  });
  const system = buildNpcPrompt(chatCtx);
  const reply = await runNpcToolLoop({
    system,
    messages,
    ctx: {
      campaignId: input.campaignId,
      npcId: input.npcId,
      playerId: input.playerId,
    },
  });

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
      reply: { say: reply.say, do: reply.do },
      messages,
      speakerName: chatCtx.npc.name,
      playerName: chatCtx.player.name,
    },
  });

  return { ...reply, turnId };
};
