import type { ILlmMessage, ISendChatParams } from './types';

const DEFAULT_GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_GROK_MODEL = 'grok-2-latest';
const GROK_MAX_TOKENS = 800;

export interface IGrokToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface IGrokMessage {
  role: string;
  content?: string | null;
  tool_calls?: IGrokToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface IGrokChoiceMessage {
  role?: string;
  content?: string | null;
  tool_calls?: IGrokToolCall[];
}

export const sendGrokChat = async ({ messages, temperature, tools }: ISendChatParams) => {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey?.trim()) throw new Error('GROK_API_KEY не задан.');

  const apiUrl = process.env.GROK_API_URL?.trim() || DEFAULT_GROK_API_URL;
  const model = process.env.GROK_MODEL?.trim() || DEFAULT_GROK_MODEL;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: GROK_MAX_TOKENS,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = 'Ошибка при обращении к Grok API.';
    try {
      const error = (await response.json()) as { message?: string; error?: { message?: string } };
      message = error.message || error.error?.message || message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: IGrokChoiceMessage }>;
  };
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error('Пустой ответ Grok.');

  return {
    role: message.role ?? 'assistant',
    content: message.content ?? null,
    tool_calls: message.tool_calls,
  } satisfies ILlmMessage;
};
