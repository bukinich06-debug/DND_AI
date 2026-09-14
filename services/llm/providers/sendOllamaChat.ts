import type { ILlmMessage, ISendChatParams } from './types';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MAX_TOKENS = 800;

interface IOllamaChoiceMessage {
  role?: string;
  content?: string | null;
  tool_calls?: ILlmMessage['tool_calls'];
}

export const sendOllamaChat = async ({ messages, temperature, tools }: ISendChatParams) => {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL?.trim();

  if (!model) throw new Error('OLLAMA_MODEL не задан.');

  const url = `${baseUrl}/v1/chat/completions`;
  const apiKey = process.env.OLLAMA_API_KEY?.trim();

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: OLLAMA_MAX_TOKENS,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = 'Ошибка при обращении к Ollama API.';
    try {
      const error = (await response.json()) as { message?: string; error?: { message?: string } };
      message = error.message || error.error?.message || message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: IOllamaChoiceMessage }>;
  };

  const message = data.choices?.[0]?.message;
  if (!message) throw new Error('Пустой ответ Ollama.');

  return {
    role: message.role ?? 'assistant',
    content: message.content ?? null,
    tool_calls: message.tool_calls,
  } satisfies ILlmMessage;
};
