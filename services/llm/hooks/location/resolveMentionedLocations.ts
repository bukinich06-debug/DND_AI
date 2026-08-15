import {
  sendDeepseekChat,
  type IDeepseekMessage,
  type IDeepseekToolCall,
} from '@/services/llm/providers/sendDeepseekChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { IToolContext } from '@/services/llm/tools/types';
import { appendToolCall } from '../store/hookLogStore';
import type { IAgentHook, IHookContext, IHookToolCall } from '../types';
import { loadLocationMentionContext } from './helpers/loadLocationMentionContext';
import { mentionLocationToolByName, mentionLocationTools } from './mentionLocationTools';

const MAX_ROUNDS = 5;
const RECENT_MESSAGE_COUNT = 6;
const HOOK_NAME = 'resolveMentionedLocations';

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
    const tool = mentionLocationToolByName.get(name);
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
Задача: зафиксировать в БД места, которые упомянул speaker — найти существующие или создать stub.

Speaker: ${ctx.speakerName} (npcId=${ctx.npcId})
Player: ${ctx.playerName} (playerId=${ctx.playerId})
campaignId: ${ctx.campaignId}

В user JSON: reply (say/do), recentMessages, chain (текущее место и родители), here (дети текущего поселения), neighbors (другие поселения того же региона), roads (дороги от текущего поселения), currentSettlementId, currentBuildingId.

Правила:
- Игнорируй туман без сущности («на востоке что-то есть»).
- Игнорируй массовку-атмосферу («на рынке говорят»), если это не место, куда можно пойти.
- Сначала сверь с here / neighbors / roads / chain (синонимы и падежи: кузню = Кузня).
- Уточнение к уже известному месту → update_mentioned_location. Не создавай дубль.
- Нет в списках → search_location → найден: при необходимости ensure_location_link; нет — create_mentioned_location.
- Здание в ЭТОЙ деревне (кузня, храм): kind=building, без containerId (сервер повесит на currentSettlementId).
- Комната в ЭТОМ здании: kind=room, без containerId.
- Соседняя деревня / город: kind=settlement. Сервер повесит в тот же регион и сделает дорогу от currentSettlementId. days из фразы («день пути»=1), иначе 1.
- «Кузня в деревне Б»: сначала найди/создай Б (settlement), затем кузню с containerId=id деревни Б.
- Дорога (ensure_location_link) только между settlement. Не линкуй здания.
- При create не выдумывай summary/description/features — опусти поля. tags: роль (smithy, кузница).
- Не вызывай tools, если нечего делать.
- Когда закончишь, ответь обычным текстом без tool calls: DONE.`;

const runMentionLoop = async (ctx: IHookContext): Promise<IHookToolCall[]> => {
  const toolCtx: IToolContext = {
    campaignId: ctx.campaignId,
    npcId: ctx.npcId,
    playerId: ctx.playerId,
  };
  const openAiTools = mentionLocationTools.map(toOpenAiCompatibleTool);
  const places = await loadLocationMentionContext({
    campaignId: ctx.campaignId,
    playerId: ctx.playerId,
    npcId: ctx.npcId,
  });
  const recentMessages = ctx.messages.slice(-RECENT_MESSAGE_COUNT);
  const userContent = JSON.stringify({
    reply: { say: ctx.reply.say, do: ctx.reply.do },
    recentMessages,
    ...places,
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
      appendToolCall(ctx.turnId, HOOK_NAME, log);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(log.ok ? { ok: true, result: log.result } : { ok: false, error: log.error }),
      });
    }
  }

  return toolCalls;
};

export const resolveMentionedLocationsHook: IAgentHook = {
  name: HOOK_NAME,
  run: runMentionLoop,
};
