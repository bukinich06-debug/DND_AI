import { getPlayer } from '@/services/player/crud/getPlayer';
import { searchLocationsByName } from '@/services/location/search/searchLocationsByName';
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

export const searchLocationTool: ILlmTool = {
  name: 'search_location',
  description:
    'Ищет локацию в кампании по имени или тегу. Сначала смотри списки here/neighbors в контексте хука; этот tool — если там нет. Пустой результат: можно create_mentioned_location.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Название или часть названия / тег (кузня, smithy)' },
    },
    required: ['name'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    let nearLocationId: string | undefined;
    if (ctx.playerId?.trim()) {
      const player = await getPlayer(ctx.playerId.trim());
      nearLocationId = player.locationId ?? undefined;
    }

    const hits = await searchLocationsByName({
      campaignId: ctx.campaignId,
      name: parsed.name,
      nearLocationId,
    });

    return hits.map((loc) => ({
      id: loc.id,
      name: loc.name,
      kind: loc.kind,
      parentId: loc.parentId,
      tags: loc.tags,
      summary: loc.summary,
    }));
  },
};
