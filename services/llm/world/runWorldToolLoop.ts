import {
  sendDeepseekChat,
  type IDeepseekMessage,
  type IDeepseekToolCall,
} from '@/services/llm/providers/sendDeepseekChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { IToolContext } from '@/services/llm/tools/types';
import { parseWorldReply, type IWorldReply } from './parseWorldReply';
import { createWorldTools } from './worldTools';

const MAX_ROUNDS = 5;

export interface IToolCallLog {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

interface IRunWorldToolLoopParams {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  ctx: IToolContext;
}

interface IRunWorldToolLoopResult extends IWorldReply {
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

export const runWorldToolLoop = async ({
  system,
  messages,
  ctx,
}: IRunWorldToolLoopParams): Promise<IRunWorldToolLoopResult> => {
  const { tools, toolByName } = createWorldTools();
  const openAiTools = tools.map(toOpenAiCompatibleTool);
  const history: IDeepseekMessage[] = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  const toolCalls: IToolCallLog[] = [];

  const runOneTool = async (call: IDeepseekToolCall): Promise<IToolCallLog> => {
    const name = call.function?.name?.trim() || '';
    let args: unknown = {};
    try {
      args = parseToolArgs(call.function?.arguments ?? '');
      const tool = toolByName.get(name);
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

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const assistant = await sendDeepseekChat({ messages: history, temperature: 0.85, tools: openAiTools });
    const calls = assistant.tool_calls;

    if (!calls || calls.length === 0) {
      const content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
      if (!content) throw new Error('Пустой ответ DeepSeek.');
      return { ...parseWorldReply(content), toolCalls };
    }

    history.push({
      role: 'assistant',
      content: assistant.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const log = await runOneTool(call);
      toolCalls.push(log);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(log.ok ? { ok: true, result: log.result } : { ok: false, error: log.error }),
      });
    }
  }

  throw new Error('Превышен лимит вызовов tools за один ответ world.');
};
