import {
  sendDeepseekChat,
  type IDeepseekMessage,
  type IDeepseekToolCall,
} from '@/services/llm/providers/sendDeepseekChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { IToolContext } from '@/services/llm/tools/types';
import { listNpcAcquaintancesDetailed } from '@/services/npc/acquaintance/listNpcAcquaintancesDetailed';
import { appendToolCall } from '../store/hookLogStore';
import type { IAgentHook, IHookContext, IHookToolCall } from '../types';
import { mentionToolByName, mentionTools } from './mentionTools';

const MAX_ROUNDS = 5;
const RECENT_MESSAGE_COUNT = 6;

const parseToolArgs = (raw: string): unknown => {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Некорректный JSON аргументов tool.');
  }
};

const runOneTool = async (call: IDeepseekToolCall, ctx: IToolContext): Promise<IHookToolCall> => {
  const name = call.function?.name?.trim() || '';
  let args: unknown = {};
  try {
    args = parseToolArgs(call.function?.arguments ?? '');
    const tool = mentionToolByName.get(name);
    if (!tool) throw new Error(`Неизвестный tool: ${name || '(пусто)'}.`);
    const result = await tool.execute(args, ctx);
    return { name, args, ok: true, result };
  } catch (e) {
    return {
      name: name || 'unknown',
      args,
      ok: false,
      error: e instanceof Error ? e.message : 'Ошибка tool.',
    };
  }
};

const buildSystemPrompt = (ctx: IHookContext) => `Ты post-processor после ответа NPC-агента.
Задача: зафиксировать в БД людей/существ, которых упомянул speaker — создать новых или обновить уже известных.

Speaker: ${ctx.speakerName} (npcId=${ctx.npcId})
Player: ${ctx.playerName} (playerId=${ctx.playerId})
campaignId: ${ctx.campaignId}

В user JSON: reply (say/do), recentMessages (хвост диалога), acquaintances (кого speaker уже знает: otherNpcId, name, title, note).

Правила:
- Игнорируй speaker и player.
- Игнорируй безымянные массовки («стража», «торговец»), если нет новой сущности и нет уточнения к знакомому.
- Сначала сверь упоминание с acquaintances (роль в title/note, provisional name вроде «Муж ${ctx.speakerName}», контекст recentMessages).
- Уточнение к уже знакомому (роль «муж» → имя «Грэг», новый факт о месте и т.п.) → update_mentioned_npc по otherNpcId. Не создавай второго NPC.
- Новое личное имя и нет match в acquaintances → search_npc → если найден — ensure_npc_acquaintance; если нет — create_mentioned_npc.
- Без личного имени, но есть устойчивая роль (муж, сестра, хозяин …) и нет match → create_mentioned_npc: title=роль, name=«Роль ${ctx.speakerName}» (например «Муж ${ctx.speakerName}»), note с якорем. Не выдумывай first name.
- При create_mentioned_npc не выдумывай appearance/personality/speech/habits и не оставляй пустые строки — лучше опусти поля (сервер подставит «неизвестно»).
- Не вызывай tools, если нечего делать.
- Когда закончишь, ответь обычным текстом без tool calls: DONE.`;

const runMentionLoop = async (ctx: IHookContext): Promise<IHookToolCall[]> => {
  const toolCtx: IToolContext = {
    campaignId: ctx.campaignId,
    npcId: ctx.npcId,
    playerId: ctx.playerId,
  };
  const openAiTools = mentionTools.map(toOpenAiCompatibleTool);
  const acquaintances = await listNpcAcquaintancesDetailed(ctx.npcId);
  const recentMessages = ctx.messages.slice(-RECENT_MESSAGE_COUNT);
  const userContent = JSON.stringify({
    reply: { say: ctx.reply.say, do: ctx.reply.do },
    recentMessages,
    acquaintances,
  });

  const history: IDeepseekMessage[] = [
    { role: 'system', content: buildSystemPrompt(ctx) },
    { role: 'user', content: userContent },
  ];
  const toolCalls: IHookToolCall[] = [];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const assistant = await sendDeepseekChat({ messages: history, tools: openAiTools });
    const calls = assistant.tool_calls;

    if (!calls || calls.length === 0) return toolCalls;

    history.push({
      role: 'assistant',
      content: assistant.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const log = await runOneTool(call, toolCtx);
      toolCalls.push(log);
      appendToolCall(ctx.turnId, 'resolveMentionedNpcs', log);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(log.ok ? { ok: true, result: log.result } : { ok: false, error: log.error }),
      });
    }
  }

  return toolCalls;
};

export const resolveMentionedNpcsHook: IAgentHook = {
  name: 'resolveMentionedNpcs',
  run: runMentionLoop,
};
