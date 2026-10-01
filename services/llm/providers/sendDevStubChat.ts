import { buildAgentStubReply, buildPlanStubContent } from './helpers/buildDevStubReply';
import { lastUserContent, parseDevCommand } from './helpers/parseDevCommand';
import type { ILlmMessage, ISendChatParams } from './types';

const PLAN_MARKER = 'планировщик';

const isPlanRequest = (messages: ISendChatParams['messages']) => {
  const system = messages.find((m) => m.role === 'system');
  const content = typeof system?.content === 'string' ? system.content : '';
  return content.toLowerCase().includes(PLAN_MARKER);
};

const systemContent = (messages: ISendChatParams['messages']) => {
  const system = messages.find((m) => m.role === 'system');
  return typeof system?.content === 'string' ? system.content : '';
};

export const sendDevStubChat = async ({ messages }: ISendChatParams): Promise<ILlmMessage> => {
  const command = parseDevCommand(lastUserContent(messages));
  const system = systemContent(messages);

  if (isPlanRequest(messages)) return { role: 'assistant', content: buildPlanStubContent(command) };

  return buildAgentStubReply(command, messages, system);
};
