import { shortRest } from '@/services/player/rest/shortRest';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  playerId: string;
  hitDice: number;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы короткого отдыха обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (!Number.isInteger(raw.hitDice) || (raw.hitDice as number) < 1)
    throw new Error('hitDice должен быть целым числом не меньше 1.');
  return { playerId: raw.playerId.trim(), hitDice: raw.hitDice as number };
};

export const shortRestTool: ILlmTool = {
  name: 'short_rest',
  description:
    'Короткий отдых: тратит hitDice костей хитов (бросок + телосложение на сервере). Не вызывай, если игрок не отдыхает. Слоты заклинаний не восстанавливает.',
  parameters: {
    type: 'object',
    properties: {
      playerId: { type: 'string', description: 'ID игрока' },
      hitDice: { type: 'integer', description: 'Сколько костей хитов потратить' },
    },
    required: ['playerId', 'hitDice'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return shortRest({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      hitDice: parsed.hitDice,
    });
  },
};
