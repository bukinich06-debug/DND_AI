import { listNpcMemoriesForAgent } from '@/services/npc/memory/listNpcMemoriesForAgent';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  npcId: string;
  playerId?: string | null;
  minImportance?: number;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы списка воспоминаний обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');

  let minImportance: number | undefined;
  if (raw.minImportance !== undefined && raw.minImportance !== null) {
    if (typeof raw.minImportance !== 'number' || !Number.isInteger(raw.minImportance))
      throw new Error('minImportance должен быть целым числом.');
    minImportance = raw.minImportance;
  }

  let playerId: string | null | undefined;
  if (raw.playerId === undefined) playerId = undefined;
  else if (raw.playerId === null) playerId = null;
  else if (typeof raw.playerId === 'string') playerId = raw.playerId.trim();
  else throw new Error('playerId должен быть строкой.');

  return {
    npcId: raw.npcId.trim(),
    playerId,
    minImportance,
  };
};

export const listNpcMemoriesTool: ILlmTool = {
  name: 'list_npc_memories',
  description:
    'Список воспоминаний NPC (сжатые факты). Можно сузить по playerId и minImportance (1–5). Сортировка: важность по убыванию. Используй, чтобы вспомнить, что NPC знает об игроке.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID NPC' },
      playerId: { type: 'string', description: 'Фильтр по игроку (опционально)' },
      minImportance: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description: 'Минимальная важность',
      },
    },
    required: ['npcId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return listNpcMemoriesForAgent(parsed.npcId, ctx.campaignId, {
      ...(parsed.playerId !== undefined ? { playerId: parsed.playerId } : {}),
      ...(parsed.minImportance !== undefined ? { minImportance: parsed.minImportance } : {}),
    });
  },
};
