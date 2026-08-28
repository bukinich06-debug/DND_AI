import { startTravel } from '@/services/player/location/startTravel';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  destinationId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы путешествия обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (typeof raw.destinationId !== 'string' || !raw.destinationId.trim())
    throw new Error('id целевой локации обязателен.');

  return { playerId: raw.playerId.trim(), destinationId: raw.destinationId.trim() };
};

export const startTravelTool: ILlmTool = {
  name: 'start_travel',
  description:
    'Начинает путешествие к удалённой локации по дорогам между поселениями. Игрок остаётся в текущем месте, пока отрезок не пройден (advance_travel). Нужен путь settlement↔settlement. Для коротких перемещений внутри поселения — move_player.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      destinationId: {
        type: 'string',
        description: 'ID целевой локации',
      },
    },
    required: ['playerId', 'destinationId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return startTravel({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      destinationId: parsed.destinationId,
    });
  },
};
