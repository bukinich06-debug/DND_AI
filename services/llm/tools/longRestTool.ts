import { longRest } from '@/services/player/rest/longRest';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы длинного отдыха обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  return { playerId: raw.playerId.trim() };
};

export const longRestTool: ILlmTool = {
  name: 'long_rest',
  description:
    'Длинный отдых: HP на максимум, половина костей хитов (минимум 1), exhaustion −1, временные хиты 0. Слоты заклинаний не трогает.',
  parameters: {
    type: 'object',
    properties: {
      playerId: { type: 'string', description: 'ID игрока' },
    },
    required: ['playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return longRest({ campaignId: ctx.campaignId, playerId: parsed.playerId });
  },
};
