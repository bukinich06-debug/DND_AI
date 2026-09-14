import { sendLlmChat, type ILlmMessage, type ILlmToolCall } from '@/services/llm/providers/sendLlmChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { ILlmTool, IToolContext } from '@/services/llm/tools/types';
import { appendToolCall } from '../store/hookLogStore';
import type { IHookContext, IHookToolCall } from '../types';

const MAX_ROUNDS = 5;

interface IRunHookToolLoopParams {
  ctx: IHookContext;
  hookName: string;
  tools: ILlmTool[];
  system: string;
  userContent: string;
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
  toolByName: Map<string, ILlmTool>,
  toolCtx: IToolContext
): Promise<IHookToolCall> => {
  const name = call.function?.name?.trim() || '';
  let args: unknown = {};
  try {
    args = parseToolArgs(call.function?.arguments ?? '');
    const tool = toolByName.get(name);
    if (!tool) throw new Error(`Неизвестный tool: ${name || '(пусто)'}.`);
    const result = await tool.execute(args, toolCtx);
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

export const runHookToolLoop = async ({
  ctx,
  hookName,
  tools,
  system,
  userContent,
}: IRunHookToolLoopParams): Promise<IHookToolCall[]> => {
  const toolByName = new Map(tools.map((tool) => [tool.name, tool]));
  const toolCtx: IToolContext = {
    campaignId: ctx.campaignId,
    npcId: ctx.npcId,
    playerId: ctx.playerId,
    locationId: ctx.locationId,
  };
  const openAiTools = tools.map(toOpenAiCompatibleTool);
  const history: ILlmMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: userContent },
  ];
  const toolCalls: IHookToolCall[] = [];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const assistant = await sendLlmChat({ messages: history, temperature: 0.3, tools: openAiTools });
    const calls = assistant.tool_calls;

    if (!calls || calls.length === 0) return toolCalls;

    history.push({
      role: 'assistant',
      content: assistant.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const log = await runOneTool(call, toolByName, toolCtx);
      toolCalls.push(log);
      appendToolCall(ctx.turnId, hookName, log);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(log.ok ? { ok: true, result: log.result } : { ok: false, error: log.error }),
      });
    }
  }

  return toolCalls;
};
