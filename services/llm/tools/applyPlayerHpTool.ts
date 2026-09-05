import { applyPlayerHp } from '@/services/player/hp/applyPlayerHp';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  delta: number;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы хитов обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (!Number.isInteger(raw.delta)) throw new Error('delta должен быть целым числом.');
  return { playerId: raw.playerId.trim(), delta: raw.delta as number };
};

export const applyPlayerHpTool: ILlmTool = {
  name: 'apply_player_hp',
  description:
    'Меняет хиты игрока на delta (отрицательное — урон вне боя: падение, ловушка, яд). Не используй для ударов врага в бою. 0 HP накладывает unconscious; лечение выше 0 снимает.',
  parameters: {
    type: 'object',
    properties: {
      playerId: { type: 'string', description: 'ID игрока' },
      delta: { type: 'integer', description: 'Изменение HP (может быть отрицательным)' },
    },
    required: ['playerId', 'delta'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return applyPlayerHp({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      delta: parsed.delta,
    });
  },
};
