const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_MAX_TOKENS = 800;

export interface IDeepseekToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface IDeepseekMessage {
  role: string;
  content?: string | null;
  tool_calls?: IDeepseekToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ISendDeepseekChatParams {
  messages: IDeepseekMessage[];
  temperature: number;
  tools?: unknown[];
}

interface IDeepseekChoiceMessage {
  role?: string;
  content?: string | null;
  tool_calls?: IDeepseekToolCall[];
}

export const sendDeepseekChat = async ({ messages, temperature, tools }: ISendDeepseekChatParams) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) throw new Error('DEEPSEEK_API_KEY не задан.');

  const body: Record<string, unknown> = {
    model: DEEPSEEK_MODEL,
    messages,
    temperature,
    max_tokens: DEEPSEEK_MAX_TOKENS,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = 'Ошибка при обращении к DeepSeek API.';
    try {
      const error = (await response.json()) as { message?: string; error?: { message?: string } };
      message = error.message || error.error?.message || message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: IDeepseekChoiceMessage }>;
  };
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error('Пустой ответ DeepSeek.');

  return {
    role: message.role ?? 'assistant',
    content: message.content ?? null,
    tool_calls: message.tool_calls,
  } satisfies IDeepseekMessage;
};
