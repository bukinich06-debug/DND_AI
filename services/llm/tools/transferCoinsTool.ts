import { CoinOwnerKind } from '@/domain/coins';
import { transferCoins } from '@/services/coins/transfer/transferCoins';
import type { ILlmTool, IToolContext } from './types';

const KIND_VALUES = Object.values(CoinOwnerKind);

type OwnerKind = (typeof CoinOwnerKind)[keyof typeof CoinOwnerKind];

interface ITransferCoinsArgs {
  fromKind: OwnerKind;
  fromId: string;
  toKind: OwnerKind;
  toId: string;
  amountCp: number;
}

const isOwnerKind = (value: unknown): value is OwnerKind =>
  typeof value === 'string' && KIND_VALUES.includes(value as OwnerKind);

const parseArgs = (args: unknown): ITransferCoinsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы перевода монет обязательны.');

  const raw = args as Record<string, unknown>;
  if (!isOwnerKind(raw.fromKind)) throw new Error('Недопустимый тип отправителя.');
  if (typeof raw.fromId !== 'string' || !raw.fromId.trim()) throw new Error('id отправителя обязателен.');
  if (!isOwnerKind(raw.toKind)) throw new Error('Недопустимый тип получателя.');
  if (typeof raw.toId !== 'string' || !raw.toId.trim()) throw new Error('id получателя обязателен.');
  if (typeof raw.amountCp !== 'number' || !Number.isInteger(raw.amountCp))
    throw new Error('amountCp должен быть целым числом медных.');

  return {
    fromKind: raw.fromKind,
    fromId: raw.fromId.trim(),
    toKind: raw.toKind,
    toId: raw.toId.trim(),
    amountCp: raw.amountCp,
  };
};

export const transferCoinsTool: ILlmTool = {
  name: 'transfer_coins',
  description:
    'Переводит монеты между владельцами (игрок, NPC, предмет). Для покупки: с игрока на торговца/сундук после get_coins. Для лута: с NPC или предмета-тайника на игрока; amountCp — сумма в медных (чтобы забрать всё, передай coinsCp из get_coins). Не вызывай, если get_coins показал, что денег не хватает.',
  parameters: {
    type: 'object',
    properties: {
      fromKind: {
        type: 'string',
        enum: KIND_VALUES,
        description: 'Тип отправителя',
      },
      fromId: {
        type: 'string',
        description: 'ID отправителя',
      },
      toKind: {
        type: 'string',
        enum: KIND_VALUES,
        description: 'Тип получателя',
      },
      toId: {
        type: 'string',
        description: 'ID получателя',
      },
      amountCp: {
        type: 'integer',
        description: 'Сумма в медных монетах (1 gp = 100 cp)',
      },
    },
    required: ['fromKind', 'fromId', 'toKind', 'toId', 'amountCp'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const result = await transferCoins({
      campaignId: ctx.campaignId,
      from: { kind: parsed.fromKind, id: parsed.fromId },
      to: { kind: parsed.toKind, id: parsed.toId },
      amountCp: parsed.amountCp,
    });

    return {
      amountCp: result.amountCp,
      from: {
        owner: result.from.owner,
        coinsCp: result.from.coinsCp,
        coins: result.from.coins,
      },
      to: {
        owner: result.to.owner,
        coinsCp: result.to.coinsCp,
        coins: result.to.coins,
      },
    };
  },
};
