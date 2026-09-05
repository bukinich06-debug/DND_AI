import { EquipSlot } from '@/domain/shared';
import { equipItem } from '@/services/item/equip/equipItem';
import type { ILlmTool, IToolContext } from './types';

const SLOTS = Object.values(EquipSlot);

interface IArgs {
  itemId: string;
  slot: EquipSlot;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы экипировки обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.itemId !== 'string' || !raw.itemId.trim()) throw new Error('id предмета обязателен.');
  if (typeof raw.slot !== 'string' || !SLOTS.includes(raw.slot as EquipSlot))
    throw new Error('Неизвестный слот экипировки.');
  return { itemId: raw.itemId.trim(), slot: raw.slot as EquipSlot };
};

export const equipItemTool: ILlmTool = {
  name: 'equip_item',
  description:
    'Надевает предмет игрока в слот armor / mainHand / offHand. Сначала search_player_items. Для «достаю свой меч» — экипировка, не спавн.',
  parameters: {
    type: 'object',
    properties: {
      itemId: { type: 'string', description: 'ID предмета в инвентаре' },
      slot: { type: 'string', enum: SLOTS, description: 'Слот' },
    },
    required: ['itemId', 'slot'],
    additionalProperties: false,
  },
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return equipItem(parsed);
  },
};
