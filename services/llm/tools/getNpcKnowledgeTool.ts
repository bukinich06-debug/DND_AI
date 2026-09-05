import { getNpcKnowledgeForAgent } from '@/services/npc/knowledge/getNpcKnowledgeForAgent';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  knowledgeId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы знания NPC обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.knowledgeId !== 'string' || !raw.knowledgeId.trim()) throw new Error('knowledgeId обязателен.');
  return { knowledgeId: raw.knowledgeId.trim() };
};

export const getNpcKnowledgeTool: ILlmTool = {
  name: 'get_npc_knowledge',
  description:
    'Одно знание NPC по id. open — полный content; check — метаданные без content (нужна проверка навыка); hidden — недоступно. Сначала обычно list_npc_knowledge.',
  parameters: {
    type: 'object',
    properties: {
      knowledgeId: { type: 'string', description: 'ID записи знания' },
    },
    required: ['knowledgeId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return getNpcKnowledgeForAgent(parsed.knowledgeId, ctx.campaignId, ctx.passedCheck);
  },
};
