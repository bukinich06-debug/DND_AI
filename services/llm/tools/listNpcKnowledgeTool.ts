import { KnowledgeReveal } from '@/domain/shared';
import { listNpcKnowledgeForAgent } from '@/services/npc/knowledge/listNpcKnowledgeForAgent';
import type { ILlmTool, IToolContext } from './types';

const REVEAL_VALUES = [KnowledgeReveal.open, KnowledgeReveal.check] as const;

interface IArgs {
  npcId: string;
  reveal?: (typeof REVEAL_VALUES)[number];
}

const isAllowedReveal = (value: unknown): value is (typeof REVEAL_VALUES)[number] =>
  typeof value === 'string' && (REVEAL_VALUES as readonly string[]).includes(value);

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы знаний NPC обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');
  if (raw.reveal !== undefined && raw.reveal !== null && !isAllowedReveal(raw.reveal))
    throw new Error('reveal: только open или check.');
  return {
    npcId: raw.npcId.trim(),
    reveal: isAllowedReveal(raw.reveal) ? raw.reveal : undefined,
  };
};

export const listNpcKnowledgeTool: ILlmTool = {
  name: 'list_npc_knowledge',
  description:
    'Список знаний NPC. По умолчанию только open (полный текст). reveal=check — заголовки и DC без content (нужна проверка). hidden недоступны. Используй, чтобы понять, о чём NPC может говорить.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID NPC' },
      reveal: {
        type: 'string',
        enum: [...REVEAL_VALUES],
        description: 'open (по умолчанию) или check',
      },
    },
    required: ['npcId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return listNpcKnowledgeForAgent(parsed.npcId, {
      reveal: parsed.reveal,
      campaignId: ctx.campaignId,
    });
  },
};
