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
    'Начинает путешествие игрока к удалённой локации по графу дорог (LocationLink). Ставит игрока на первый отрезок пути и считает дни. Нужна текущая локация и существующий путь. Для коротких перемещений внутри места — move_player.',
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
