import { sendLlmChat, type ILlmMessage, type ILlmToolCall } from '@/services/llm/providers/sendLlmChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { IToolContext } from '@/services/llm/tools/types';
import { combatToolByName, combatTools } from './combatTools';
import { parseCombatReply, type ICombatReply } from './parseCombatReply';

const MAX_ROUNDS = 5;

export interface IToolCallLog {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

interface IRunCombatToolLoopParams {
  system: string;
  ctx: IToolContext;
}

interface IRunCombatToolLoopResult extends ICombatReply {
  toolCalls: IToolCallLog[];
}

const parseToolArgs = (raw: string): unknown => {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Некорректный JSON аргументов tool.');
  }
};

const runOneTool = async (
  call: ILlmToolCall,
  ctx: IToolContext,
  actionState: { attackUsed: boolean; totalMoved: number; consumableUsed: boolean; playerSpeed: number }
): Promise<IToolCallLog> => {
  const name = call.function?.name?.trim() || '';
  let args: unknown = {};
  try {
    args = parseToolArgs(call.function?.arguments ?? '');

    if (name === 'resolve_player_attack') {
      if (actionState.attackUsed) {
        return {
          name,
          args,
          ok: false,
          error: 'ACTION_ALREADY_USED: Атака уже использована в этом ходу.',
        };
      }
    }

    if (name === 'move_player_in_combat') {
      const moveArgs = args as { feet?: number };
      const requestedFeet = moveArgs.feet ?? actionState.playerSpeed;
      if (actionState.totalMoved + requestedFeet > actionState.playerSpeed) {
        return {
          name,
          args,
          ok: false,
          error: `MOVEMENT_EXCEEDED: Превышен лимит движения (уже двигался ${actionState.totalMoved} фт из ${actionState.playerSpeed} фт).`,
        };
      }
    }

    if (name === 'use_player_consumable') {
      if (actionState.consumableUsed) {
        return {
          name,
          args,
          ok: false,
          error: 'BONUS_ACTION_USED: Бонусное действие (расходник) уже использовано в этом ходу.',
        };
      }
    }

    const tool = combatToolByName.get(name);
    if (!tool) throw new Error(`Неизвестный tool: ${name || '(пусто)'}.`);
    const result = await tool.execute(args, ctx);

    if (name === 'resolve_player_attack') {
      actionState.attackUsed = true;
    }

    if (name === 'move_player_in_combat') {
      const moveResult = result as { movedFeet?: number };
      if (moveResult.movedFeet) {
        actionState.totalMoved += moveResult.movedFeet;
      }
    }

    if (name === 'use_player_consumable') {
      actionState.consumableUsed = true;
    }

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

export const runCombatToolLoop = async ({
  system,
  ctx,
}: IRunCombatToolLoopParams): Promise<IRunCombatToolLoopResult> => {
  const openAiTools = combatTools.map(toOpenAiCompatibleTool);
  const history: ILlmMessage[] = [{ role: 'system', content: system }];
  const toolCalls: IToolCallLog[] = [];

  let playerSpeed = 30;
  if (ctx.playerId) {
    const { playerRepository } = await import('@/data/player');
    const player = await playerRepository.getById(ctx.playerId);
    if (player) playerSpeed = player.speed;
  }

  const actionState = {
    attackUsed: false,
    totalMoved: 0,
    consumableUsed: false,
    playerSpeed,
  };

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const assistant = await sendLlmChat({ messages: history, temperature: 0.7, tools: openAiTools });
    const calls = assistant.tool_calls;

    if (!calls || calls.length === 0) {
      const content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
      if (!content) throw new Error('Пустой ответ LLM.');
      const reply = parseCombatReply(content);
      return { ...reply, toolCalls };
    }

    history.push({
      role: 'assistant',
      content: assistant.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const log = await runOneTool(call, ctx, actionState);
      toolCalls.push(log);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(log.ok ? { ok: true, result: log.result } : { ok: false, error: log.error }),
      });
    }
  }

  throw new Error('Превышен лимит вызовов tools за один ход игрока.');
};
