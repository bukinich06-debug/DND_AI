import { sendLlmChat, type ILlmMessage, type ILlmToolCall } from '@/services/llm/providers/sendLlmChat';
import { toOpenAiCompatibleTool } from '@/services/llm/tools/toOpenAiCompatibleTool';
import type { IToolContext } from '@/services/llm/tools/types';
import { buildPlanUserMessage } from './buildPlanUserMessage';
import { parsePlanReply, type IParsedPlanStep } from './parsePlanReply';
import { planToolByName, planTools } from './planTools';

const MAX_ROUNDS = 5;

const RETRY_JSON_HINT = 'Верни только JSON-массив шагов или {"error":"..."}. Без сцены, речи и описаний.';

export interface IToolCallLog {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

interface IRunPlanToolLoopParams {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  ctx: IToolContext;
}

interface IRunPlanToolLoopResult {
  steps: IParsedPlanStep[];
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
    const tool = planToolByName.get(name);
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

const parseFinalContent = async (
  content: string,
  history: ILlmMessage[],
  openAiTools: unknown[]
): Promise<IParsedPlanStep[]> => {
  try {
    return parsePlanReply(content);
  } catch (firstError) {
    history.push({ role: 'assistant', content });
    history.push({ role: 'user', content: RETRY_JSON_HINT });

    const retry = await sendLlmChat({ messages: history, temperature: 0.1, tools: openAiTools });
    if (retry.tool_calls && retry.tool_calls.length > 0)
      throw firstError instanceof Error ? firstError : new Error('Некорректный ответ планировщика.');

    const retryContent = typeof retry.content === 'string' ? retry.content.trim() : '';
    if (!retryContent) throw new Error('Пустой ответ LLM.');
    return parsePlanReply(retryContent);
  }
};

export const runPlanToolLoop = async ({
  system,
  messages,
  ctx,
}: IRunPlanToolLoopParams): Promise<IRunPlanToolLoopResult> => {
  const openAiTools = planTools.map(toOpenAiCompatibleTool);
  const history: ILlmMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: buildPlanUserMessage(messages) },
  ];
  const toolCalls: IToolCallLog[] = [];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const assistant = await sendLlmChat({ messages: history, temperature: 0.1, tools: openAiTools });
    const calls = assistant.tool_calls;

    if (!calls || calls.length === 0) {
      const content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
      if (!content) throw new Error('Пустой ответ LLM.');
      return { steps: await parseFinalContent(content, history, openAiTools), toolCalls };
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

  throw new Error('Превышен лимит вызовов tools за один ответ планировщика.');
};
