import { searchItemCatalog } from '@/domain/item';
import type { ILlmTool, IToolContext } from './types';

interface ISearchItemCatalogArgs {
  query?: string | null;
}

const parseArgs = (args: unknown): ISearchItemCatalogArgs => {
  if (args === undefined || args === null) return {};
  if (typeof args !== 'object') throw new Error('Аргументы поиска в справочнике должны быть объектом.');

  const raw = args as Record<string, unknown>;
  let query: string | null = null;
  if (raw.query !== undefined && raw.query !== null) {
    if (typeof raw.query !== 'string') throw new Error('query должен быть строкой.');
    query = raw.query;
  }

  return { query };
};

export const searchItemCatalogTool: ILlmTool = {
  name: 'search_item_catalog',
  description:
    'Ищет предметы PHB в справочнике. Без query — весь каталог (ограничен). С query — кандидаты по имени. Возвращает key (для grant_catalog_item), name, kind, rarity, valueCp, description. НЕ создаёт предметы — только поиск шаблонов. Уникальные предметы кампании, не описанные в PHB, искать здесь нельзя.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Поисковый запрос (имя предмета). Без query — список предметов справочника.',
      },
    },
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const result = searchItemCatalog(parsed.query);

    return {
      query: result.query,
      exact: result.exact,
      items: result.items.map((item) => ({
        key: item.key,
        name: item.name,
        kind: item.kind,
        rarity: item.rarity,
        valueCp: item.valueCp,
        weight: item.weight,
        description: item.description,
        isMagical: item.isMagical,
      })),
    };
  },
};
