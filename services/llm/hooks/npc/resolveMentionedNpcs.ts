import { listNpcAcquaintancesDetailed } from '@/services/npc/acquaintance/listNpcAcquaintancesDetailed';
import { runHookToolLoop } from '../helpers/runHookToolLoop';
import type { IAgentHook, IHookContext, IHookToolCall } from '../types';
import { mentionTools } from './mentionTools';

const HOOK_NAME = 'resolveMentionedNpcs';
const RECENT_MESSAGE_COUNT = 6;

const buildSystemPrompt = (ctx: IHookContext) => {
  if (!ctx.npcId?.trim() || !ctx.speakerName?.trim()) throw new Error('npcId спикера обязателен.');

  return `Ты post-processor после ответа NPC-агента.
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
- При create_mentioned_npc не выдумывай personality/speech/habits и не оставляй пустые строки — лучше опусти поля (сервер подставит «неизвестно»).
- Не пиши в note / memory / appearance земные этносы и религии. Appearance заполняй расой D&D только если speaker её уже назвал. Иначе опусти.
- Не вызывай tools, если нечего делать.
- Когда закончишь, ответь обычным текстом без tool calls: DONE.`;
};

const runMentionLoop = async (ctx: IHookContext): Promise<IHookToolCall[]> => {
  if (!ctx.npcId?.trim()) throw new Error('npcId спикера обязателен.');

  const acquaintances = await listNpcAcquaintancesDetailed(ctx.npcId);
  const recentMessages = ctx.messages.slice(-RECENT_MESSAGE_COUNT);
  const userContent = JSON.stringify({
    reply: { say: ctx.reply.say, do: ctx.reply.do },
    recentMessages,
    acquaintances,
  });

  return runHookToolLoop({
    ctx,
    hookName: HOOK_NAME,
    tools: mentionTools,
    system: buildSystemPrompt(ctx),
    userContent,
  });
};

export const resolveMentionedNpcsHook: IAgentHook = {
  name: HOOK_NAME,
  run: runMentionLoop,
};
