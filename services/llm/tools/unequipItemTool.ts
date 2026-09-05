import { unequipItem } from '@/services/item/equip/unequipItem';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  itemId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы снятия предмета обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.itemId !== 'string' || !raw.itemId.trim()) throw new Error('id предмета обязателен.');
  return { itemId: raw.itemId.trim() };
};

export const unequipItemTool: ILlmTool = {
  name: 'unequip_item',
  description: 'Снимает предмет игрока в сумку (equipSlot = null).',
  parameters: {
    type: 'object',
    properties: {
      itemId: { type: 'string', description: 'ID надетого предмета' },
    },
    required: ['itemId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return unequipItem(parsed);
  },
};
