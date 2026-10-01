import { isDevAppEnv } from '@/domain/shared/appEnv';
import { sendDeepseekChat } from './sendDeepseekChat';
import { sendDevStubChat } from './sendDevStubChat';
import { sendOllamaChat } from './sendOllamaChat';
import { sendGrokChat } from './sendGrokChat';
import type { ILlmMessage, ISendChatParams } from './types';

type LlmProvider = 'deepseek' | 'ollama' | 'grok';

const getProvider = (): LlmProvider => {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === 'deepseek') return 'deepseek';
  if (provider === 'ollama') return 'ollama';
  if (provider === 'grok') return 'grok';

  throw new Error(`Неизвестный LLM_PROVIDER: ${provider}. Доступны: deepseek, ollama, grok.`);
};

const hasCloudApiKey = (provider: LlmProvider) => {
  if (provider === 'deepseek') return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  if (provider === 'grok') return Boolean(process.env.GROK_API_KEY?.trim());
  return true;
};

export const sendLlmChat = async (params: ISendChatParams): Promise<ILlmMessage> => {
  const provider = getProvider();

  if (isDevAppEnv() && !hasCloudApiKey(provider)) return sendDevStubChat(params);

  switch (provider) {
    case 'deepseek':
      return sendDeepseekChat(params);
    case 'ollama':
      return sendOllamaChat(params);
    case 'grok':
      return sendGrokChat(params);
    default:
      throw new Error(`Провайдер ${provider} не поддерживается.`);
  }
};

export type { ILlmMessage, ILlmToolCall } from './types';
