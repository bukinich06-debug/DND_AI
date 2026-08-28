import { runHookToolLoop } from '../helpers/runHookToolLoop';
import type { IAgentHook, IHookContext, IHookToolCall } from '../types';
import { loadWorldHookContext } from './helpers/loadWorldHookContext';
import { worldLocationTools } from './worldLocationTools';

const HOOK_NAME = 'resolveWorldLocations';

const buildSystemPrompt = (ctx: IHookContext) => {
  if (!ctx.locationId?.trim()) throw new Error('locationId обязателен.');

  return `Ты post-processor после осмотра места (world-агент).
Задача: зафиксировать в БД места из look — найти существующие или создать stub.

Speaker нет. Player: ${ctx.playerName} (playerId=${ctx.playerId})
campaignId: ${ctx.campaignId}
currentLocationId: ${ctx.locationId} (description уже записан — look)

В user JSON: reply (say = look), current, parent, children, currentLocationId.

Правила:
- Игнорируй туман без сущности («где-то на востоке»).
- Сначала сверь с children и parent (синонимы и падежи: задняя дверь = Дверь в кухню).
- Уточнение к уже известному месту → update_mentioned_location. Не создавай дубль.
- Не обновляй description текущей локации (currentLocationId) — look уже записан. Имя/tags/summary текущего места трогать только если look явно даёт новое имя или роль.
- Нет в списках → search_location → найден: не вызывай ensure_location_link (его нет); нет — create_mentioned_location.
- Комната / закуток / дверь внутри ТЕКУЩЕГО здания: kind=room, без containerId (сервер повесит на текущее здание).
- Не плоди соседние поселения из осмотра таверны, комнаты или здания. kind=settlement только если look явно называет другое поселение как отдельное место, куда можно пойти.
- При create не выдумывай summary/description/features — опусти поля. tags: роль (kitchen, кухня).
- Не вызывай tools, если нечего делать.
- Когда закончишь, ответь обычным текстом без tool calls: DONE.`;
};

const runWorldLocationLoop = async (ctx: IHookContext): Promise<IHookToolCall[]> => {
  if (!ctx.locationId?.trim()) throw new Error('locationId обязателен.');

  const places = await loadWorldHookContext(ctx);
  const userContent = JSON.stringify({
    reply: { say: ctx.reply.say, do: ctx.reply.do },
    current: places.current,
    parent: places.parent,
    children: places.children,
    currentLocationId: places.currentLocationId,
  });

  return runHookToolLoop({
    ctx,
    hookName: HOOK_NAME,
    tools: worldLocationTools,
    system: buildSystemPrompt(ctx),
    userContent,
  });
};

export const resolveWorldLocationsHook: IAgentHook = {
  name: HOOK_NAME,
  run: runWorldLocationLoop,
};
