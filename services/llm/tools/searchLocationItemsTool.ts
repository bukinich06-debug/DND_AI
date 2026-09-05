import { searchLocationItems } from '@/services/item/search/searchLocationItems';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  locationId?: string | null;
  query?: string | null;
}

const parseArgs = (args: unknown): IArgs => {
  if (args == null) return {};
  if (typeof args !== 'object') throw new Error('Аргументы поиска предметов локации некорректны.');
  const raw = args as Record<string, unknown>;

  let locationId: string | null = null;
  if (raw.locationId !== undefined && raw.locationId !== null) {
    if (typeof raw.locationId !== 'string') throw new Error('locationId должен быть строкой.');
    locationId = raw.locationId.trim() || null;
  }

  let query: string | null = null;
  if (raw.query !== undefined && raw.query !== null) {
    if (typeof raw.query !== 'string') throw new Error('query должен быть строкой.');
    query = raw.query;
  }

  return { locationId, query };
};

export const searchLocationItemsTool: ILlmTool = {
  name: 'search_location_items',
  description:
    'Предметы, лежащие в локации (на полу, на стойке как лут). Без query — все. Пустой список — предмета нет: нельзя подтвердить подъём. Не выдумывай лут. По умолчанию — текущая локация игрока.',
  parameters: {
    type: 'object',
    properties: {
      locationId: {
        type: 'string',
        description: 'ID локации. Если нет — текущая локация игрока.',
      },
      query: {
        type: 'string',
        description: 'Имя предмета. Без query — полный список.',
      },
    },
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    let locationId = parsed.locationId || '';
    if (!locationId) {
      const playerId = ctx.playerId?.trim() || '';
      if (!playerId) throw new Error('id игрока обязателен.');
      const loc = await getPlayerLocation({ campaignId: ctx.campaignId, playerId });
      if (!loc.location) throw new Error('У игрока нет текущей локации.');
      locationId = loc.location.id;
    }

    const result = await searchLocationItems({
      campaignId: ctx.campaignId,
      locationId,
      query: parsed.query,
    });

    return {
      locationId: result.locationId,
      query: result.query,
      exact: result.exact,
      items: result.items,
    };
  },
};
