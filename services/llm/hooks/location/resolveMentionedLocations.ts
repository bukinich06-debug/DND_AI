import { runHookToolLoop } from '../helpers/runHookToolLoop';
import type { IAgentHook, IHookContext, IHookToolCall } from '../types';
import { loadLocationMentionContext } from './helpers/loadLocationMentionContext';
import { mentionLocationTools } from './mentionLocationTools';

const HOOK_NAME = 'resolveMentionedLocations';
const RECENT_MESSAGE_COUNT = 6;

const buildSystemPrompt = (ctx: IHookContext) => {
  if (!ctx.npcId?.trim() || !ctx.speakerName?.trim()) throw new Error('npcId спикера обязателен.');

  return `Ты post-processor после ответа NPC-агента.
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
};

const runMentionLoop = async (ctx: IHookContext): Promise<IHookToolCall[]> => {
  if (!ctx.npcId?.trim()) throw new Error('npcId спикера обязателен.');

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

  return runHookToolLoop({
    ctx,
    hookName: HOOK_NAME,
    tools: mentionLocationTools,
    system: buildSystemPrompt(ctx),
    userContent,
  });
};

export const resolveMentionedLocationsHook: IAgentHook = {
  name: HOOK_NAME,
  run: runMentionLoop,
};
