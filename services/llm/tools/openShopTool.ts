import { ensureShopStock } from '@/services/shop/ensureShopStock';
import { getNpc } from '@/services/npc/crud/getNpc';
import type { ILlmTool, IToolContext } from './types';

interface IOpenShopArgs {
  npcId: string;
}

const parseArgs = (args: unknown): IOpenShopArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы открытия магазина обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');
  return { npcId: raw.npcId.trim() };
};

export const openShopTool: ILlmTool = {
  name: 'open_shop',
  description:
    'Открывает окно магазина для игрока, чтобы просмотреть и купить товары у торговца NPC. Вызывай этот инструмент, когда игрок хочет купить что-то у торговца или просмотреть ассортимент. NPC должен иметь shopSpecialtyKey (быть торговцем).',
  parameters: {
    type: 'object',
    properties: {
      npcId: {
        type: 'string',
        description: 'ID торговца NPC, у которого покупает игрок',
      },
    },
    required: ['npcId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const npc = await getNpc(parsed.npcId);

    if (npc.campaignId !== ctx.campaignId) throw new Error('NPC не принадлежит этой кампании.');
    if (!npc.shopSpecialtyKey) throw new Error('NPC не является торговцем.');

    await ensureShopStock(npc.id);

    return {
      npcId: npc.id,
      npcName: npc.name,
      shopSpecialtyKey: npc.shopSpecialtyKey,
      message: `Открыт магазин ${npc.name}. UI отобразит товары.`,
      ui: {
        openShop: {
          npcId: npc.id,
          npcName: npc.name,
        },
      },
    };
  },
};
