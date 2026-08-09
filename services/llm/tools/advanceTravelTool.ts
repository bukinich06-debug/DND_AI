import { advanceTravel } from '@/services/player/location/advanceTravel';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  days?: number;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы продвижения пути обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');

  let days: number | undefined;
  if (raw.days !== undefined) {
    if (typeof raw.days !== 'number' || !Number.isInteger(raw.days) || raw.days < 1)
      throw new Error('Число дней должно быть целым числом не меньше 1.');
    days = raw.days;
  }

  return { playerId: raw.playerId.trim(), days };
};

export const advanceTravelTool: ILlmTool = {
  name: 'advance_travel',
  description:
    'Продвигает активное путешествие на N дней (по умолчанию 1). Уменьшает дни на текущем отрезке; при нуле переходит к следующей локации маршрута или завершает путь (прибытие). Не вызывай во время незавершённой сцены на отрезке (засада и т.п.), пока игрок не продолжает путь.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      days: {
        type: 'integer',
        description: 'Сколько дней пути прошло (по умолчанию 1)',
        minimum: 1,
      },
    },
    required: ['playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return advanceTravel({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      days: parsed.days,
    });
  },
};
