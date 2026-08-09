import { getPlayerConditions } from '@/services/player/conditions/getPlayerConditions';
import type { ILlmTool, IToolContext } from './types';

interface IGetPlayerConditionsArgs {
  playerId: string;
}

const parseArgs = (args: unknown): IGetPlayerConditionsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы запроса состояний обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');

  return { playerId: raw.playerId.trim() };
};

export const getPlayerConditionsTool: ILlmTool = {
  name: 'get_player_conditions',
  description:
    'Возвращает активные состояния игрока (PHB 2024: blinded, charmed, unconscious и т.д.), уровень истощения и краткие правила. Вызывай перед действием (идти, атаковать, говорить), чтобы учесть ограничения. «Сон» = unconscious. На уровне истощения 6 персонаж умирает — отрази в нарративе.',
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
    const result = await getPlayerConditions({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
    });

    return {
      playerId: result.playerId,
      conditions: result.conditions,
      exhaustionLevel: result.exhaustionLevel,
      rules: result.rules,
    };
  },
};
