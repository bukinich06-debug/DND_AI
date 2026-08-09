import { movePlayer } from '@/services/player/location/movePlayer';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  locationId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы перемещения обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (typeof raw.locationId !== 'string' || !raw.locationId.trim()) throw new Error('id локации обязателен.');

  return { playerId: raw.playerId.trim(), locationId: raw.locationId.trim() };
};

export const movePlayerTool: ILlmTool = {
  name: 'move_player',
  description:
    'Мгновенно перемещает игрока в локацию (таверна в деревне, комната и т.п.). Сбрасывает активное путешествие. Не используй для дальних путей на несколько дней — для них start_travel.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      locationId: {
        type: 'string',
        description: 'ID локации, куда переместить',
      },
    },
    required: ['playerId', 'locationId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return movePlayer({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      locationId: parsed.locationId,
    });
  },
};
