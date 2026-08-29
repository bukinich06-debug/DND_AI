import { searchPlayerItems } from '@/services/item/search/searchPlayerItems';
import type { ILlmTool, IToolContext } from './types';

interface ISearchPlayerItemsArgs {
  playerId: string;
  query?: string | null;
}

const parseArgs = (args: unknown): ISearchPlayerItemsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы поиска предметов обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');

  let query: string | null = null;
  if (raw.query !== undefined && raw.query !== null) {
    if (typeof raw.query !== 'string') throw new Error('query должен быть строкой.');
    query = raw.query;
  }

  return { playerId: raw.playerId.trim(), query };
};

export const searchPlayerItemsTool: ILlmTool = {
  name: 'search_player_items',
  description:
    'Ищет предметы в инвентаре игрока. Без query — весь инвентарь. С query — кандидаты по имени/описанию; для инструментов PHB (thieves tools, воровские инструменты и т.п.) матч по стандартным именам. Для уникальных/магических предметов («лампа всевидения») бери кандидата и читай description/properties, чтобы описать эффект. Если список пуст — предмета нет. Перед использованием предмета вызывай этот tool. equipSlot: null — в сумке; armor — надет доспех; mainHand/offHand — в руках.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      query: {
        type: 'string',
        description: 'Поисковый запрос (имя предмета или инструмента). Без query — полный инвентарь.',
      },
    },
    required: ['playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const result = await searchPlayerItems({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      query: parsed.query,
    });

    return {
      playerId: result.playerId,
      query: result.query,
      exact: result.exact,
      items: result.items,
    };
  },
};
