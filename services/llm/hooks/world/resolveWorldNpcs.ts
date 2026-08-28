import { runHookToolLoop } from '../helpers/runHookToolLoop';
import type { IAgentHook, IHookContext, IHookToolCall } from '../types';
import { loadWorldHookContext } from './helpers/loadWorldHookContext';
import { worldNpcTools } from './worldNpcTools';

const HOOK_NAME = 'resolveWorldNpcs';

const buildSystemPrompt = (ctx: IHookContext) => {
  if (!ctx.locationId?.trim()) throw new Error('locationId обязателен.');

  return `Ты post-processor после осмотра места (world-агент).
Задача: зафиксировать в БД людей из look — найти существующих или создать stub в этой локации.

Speaker нет. Player: ${ctx.playerName} (playerId=${ctx.playerId})
campaignId: ${ctx.campaignId}
currentLocationId: ${ctx.locationId} (новых NPC сервер сажает сюда)

В user JSON: reply (say = look), npcsHere, currentLocationId.

Правила:
- Игнорируй player.
- Игнорируй массовку без сущности («патроны у стойки», «стража», «толпа»), если нет имени и нет устойчивой роли одного человека.
- Сначала сверь с npcsHere (имена, роли в title, синонимы).
- Уточнение к уже существующему здесь → update_mentioned_npc. Не создавай дубль. Без speaker: только карточка, без acquaintance/memory.
- Новое личное имя или устойчивая роль (бармен, хозяин, кузнец) и нет match → search_npc → найден: не вызывай ensure_npc_acquaintance (его нет); нет — create_mentioned_npc.
- Без личного имени: title=роль, name=роль (например «Бармен»). Не выдумывай first name.
- При create_mentioned_npc не выдумывай appearance/personality/speech/habits и не оставляй пустые строки — опусти поля. Не передавай memory/note.
- Не вызывай tools, если нечего делать.
- Когда закончишь, ответь обычным текстом без tool calls: DONE.`;
};

const runWorldNpcLoop = async (ctx: IHookContext): Promise<IHookToolCall[]> => {
  if (!ctx.locationId?.trim()) throw new Error('locationId обязателен.');

  const world = await loadWorldHookContext(ctx);
  const userContent = JSON.stringify({
    reply: { say: ctx.reply.say, do: ctx.reply.do },
    npcsHere: world.npcsHere,
    currentLocationId: world.currentLocationId,
  });

  return runHookToolLoop({
    ctx,
    hookName: HOOK_NAME,
    tools: worldNpcTools,
    system: buildSystemPrompt(ctx),
    userContent,
  });
};

export const resolveWorldNpcsHook: IAgentHook = {
  name: HOOK_NAME,
  run: runWorldNpcLoop,
};
