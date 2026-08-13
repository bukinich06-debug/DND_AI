import { searchNpcsByName } from '@/services/npc/search/searchNpcsByName';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  name: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы поиска обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.name !== 'string' || !raw.name.trim()) throw new Error('name обязателен.');
  return { name: raw.name.trim() };
};

export const searchNpcTool: ILlmTool = {
  name: 'search_npc',
  description:
    'Ищет NPC в кампании по имени. Сначала возвращает тех, кого уже знает speaker (ctx.npcId). Если пусто — NPC нет, можно create_mentioned_npc.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Имя или часть имени NPC' },
    },
    required: ['name'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const hits = await searchNpcsByName({
      campaignId: ctx.campaignId,
      name: parsed.name,
      speakerNpcId: ctx.npcId,
    });
    return hits.map((h) => ({
      id: h.npc.id,
      name: h.npc.name,
      title: h.npc.title,
      knownBySpeaker: h.knownBySpeaker,
    }));
  },
};
