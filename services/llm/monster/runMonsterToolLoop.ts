import { sendLlmChat, type ILlmMessage, type ILlmToolCall } from '@/services/llm/providers/sendLlmChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { IToolContext } from '@/services/llm/tools/types';
import { monsterToolByName, monsterTools } from './monsterTools';
import { parseMonsterReply, type IMonsterReply } from './parseMonsterReply';

const MAX_ROUNDS = 5;

export interface IToolCallLog {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

interface IRunMonsterToolLoopParams {
  system: string;
  ctx: IToolContext;
}

interface IRunMonsterToolLoopResult extends IMonsterReply {
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

const runOneTool = async (call: ILlmToolCall, ctx: IToolContext): Promise<IToolCallLog> => {
  const name = call.function?.name?.trim() || '';
  let args: unknown = {};
  try {
    args = parseToolArgs(call.function?.arguments ?? '');
    const tool = monsterToolByName.get(name);
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

export const runMonsterToolLoop = async ({
  system,
  ctx,
}: IRunMonsterToolLoopParams): Promise<IRunMonsterToolLoopResult> => {
  const openAiTools = monsterTools.map(toOpenAiCompatibleTool);
  const history: ILlmMessage[] = [{ role: 'system', content: system }];
  const toolCalls: IToolCallLog[] = [];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const assistant = await sendLlmChat({ messages: history, temperature: 0.7, tools: openAiTools });
    const calls = assistant.tool_calls;

    if (!calls || calls.length === 0) {
      const content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
      if (!content) throw new Error('Пустой ответ LLM.');
      const reply = parseMonsterReply(content);
      return { ...reply, toolCalls };
    }

    history.push({
      role: 'assistant',
      content: assistant.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const log = await runOneTool(call, ctx);
      toolCalls.push(log);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(log.ok ? { ok: true, result: log.result } : { ok: false, error: log.error }),
      });
    }
  }

  throw new Error('Превышен лимит вызовов tools за один ход монстра.');
};
