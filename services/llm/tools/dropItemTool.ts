import { dropItem } from '@/services/item/transfer/dropItem';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  itemId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы сброса предмета обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (typeof raw.itemId !== 'string' || !raw.itemId.trim()) throw new Error('id предмета обязателен.');
  return { playerId: raw.playerId.trim(), itemId: raw.itemId.trim() };
};

export const dropItemTool: ILlmTool = {
  name: 'drop_item',
  description: 'Бросает предмет игрока на пол текущей локации. Сначала search_player_items. Снимает с экипировки.',
  parameters: {
    type: 'object',
    properties: {
      playerId: { type: 'string', description: 'ID игрока' },
      itemId: { type: 'string', description: 'ID предмета у игрока' },
    },
    required: ['playerId', 'itemId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return dropItem(parsed);
  },
};
