import { takeItem } from '@/services/item/transfer/takeItem';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  itemId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы подъёма предмета обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (typeof raw.itemId !== 'string' || !raw.itemId.trim()) throw new Error('id предмета обязателен.');
  return { playerId: raw.playerId.trim(), itemId: raw.itemId.trim() };
};

export const takeItemTool: ILlmTool = {
  name: 'take_item',
  description:
    'Подбирает предмет, который уже лежит в текущей локации игрока. Сначала search_location_items. Нет предмета в результате — не вызывай и не пиши, что подняли. Не создаёт предметы.',
  parameters: {
    type: 'object',
    properties: {
      playerId: { type: 'string', description: 'ID игрока' },
      itemId: { type: 'string', description: 'ID предмета в локации' },
    },
    required: ['playerId', 'itemId'],
    additionalProperties: false,
  },
  execute: async (args: unknown) => {
    const parsed = parseArgs(args);
    return takeItem(parsed);
  },
};
