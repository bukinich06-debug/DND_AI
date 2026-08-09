import { CoinOwnerKind } from '@/domain/coins';
import { getCoins } from '@/services/coins/get/getCoins';
import type { ILlmTool, IToolContext } from './types';

const KIND_VALUES = Object.values(CoinOwnerKind);

interface IGetCoinsArgs {
  kind: (typeof CoinOwnerKind)[keyof typeof CoinOwnerKind];
  id: string;
}

const isOwnerKind = (value: unknown): value is IGetCoinsArgs['kind'] =>
  typeof value === 'string' && KIND_VALUES.includes(value as IGetCoinsArgs['kind']);

const parseArgs = (args: unknown): IGetCoinsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы запроса монет обязательны.');

  const raw = args as Record<string, unknown>;
  if (!isOwnerKind(raw.kind)) throw new Error('Недопустимый тип владельца.');
  if (typeof raw.id !== 'string' || !raw.id.trim()) throw new Error('id владельца обязателен.');

  return { kind: raw.kind, id: raw.id.trim() };
};

export const getCoinsTool: ILlmTool = {
  name: 'get_coins',
  description:
    'Возвращает баланс монет владельца (игрок, NPC или предмет-тайник) в медных и с разбивкой pp/gp/ep/sp/cp. Используй перед покупкой, чтобы проверить, хватает ли денег, и перед лутом с трупа/сундука, чтобы узнать сумму.',
  parameters: {
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: KIND_VALUES,
        description: 'Тип владельца: player, npc или item',
      },
      id: {
        type: 'string',
        description: 'ID владельца',
      },
    },
    required: ['kind', 'id'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const balance = await getCoins({
      campaignId: ctx.campaignId,
      owner: { kind: parsed.kind, id: parsed.id },
    });

    return {
      owner: balance.owner,
      coinsCp: balance.coinsCp,
      coins: balance.coins,
    };
  },
};
