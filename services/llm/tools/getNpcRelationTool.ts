import { getNpcRelationOrDefault } from '@/services/npc/relation/getNpcRelationOrDefault';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  npcId: string;
  playerId: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы отношения NPC обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('playerId обязателен.');
  return { npcId: raw.npcId.trim(), playerId: raw.playerId.trim() };
};

export const getNpcRelationTool: ILlmTool = {
  name: 'get_npc_relation',
  description:
    'Возвращает отношение NPC к игроку: score (−100…100), stance (hostile/cold/neutral/warm/devoted) и заметку. Если записи ещё нет — score 0 и stance neutral. Используй перед ответом, чтобы понять тон разговора.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID NPC' },
      playerId: { type: 'string', description: 'ID игрока' },
    },
    required: ['npcId', 'playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return getNpcRelationOrDefault(parsed.npcId, parsed.playerId, ctx.campaignId);
  },
};
