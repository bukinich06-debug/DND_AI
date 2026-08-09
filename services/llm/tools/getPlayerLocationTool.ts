import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы запроса локации обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');

  return { playerId: raw.playerId.trim() };
};

export const getPlayerLocationTool: ILlmTool = {
  name: 'get_player_location',
  description:
    'Возвращает текущую локацию игрока и состояние путешествия (если в пути: цель, маршрут, оставшиеся дни на отрезке). Вызывай перед сценой перемещения или когда нужно понять, где персонаж и дошёл ли он.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
    },
    required: ['playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return getPlayerLocation({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
    });
  },
};
