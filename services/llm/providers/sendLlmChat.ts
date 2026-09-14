import { sendDeepseekChat } from './sendDeepseekChat';
import { sendOllamaChat } from './sendOllamaChat';
import type { ILlmMessage, ISendChatParams } from './types';

type LlmProvider = 'deepseek' | 'ollama';

const getProvider = (): LlmProvider => {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
  
  if (!provider || provider === 'deepseek') return 'deepseek';
  if (provider === 'ollama') return 'ollama';
  
  throw new Error(`Неизвестный LLM_PROVIDER: ${provider}. Доступны: deepseek, ollama.`);
};

export const sendLlmChat = async (params: ISendChatParams): Promise<ILlmMessage> => {
  const provider = getProvider();
  
  switch (provider) {
    case 'deepseek':
      return sendDeepseekChat(params);
    case 'ollama':
      return sendOllamaChat(params);
    default:
      throw new Error(`Провайдер ${provider} не поддерживается.`);
  }
};

export type { ILlmMessage, ILlmToolCall } from './types';
