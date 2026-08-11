import { MemoryKind } from '@/domain/shared';
import { createNpcMemoryForAgent } from '@/services/npc/memory/createNpcMemoryForAgent';
import type { ILlmTool, IToolContext } from './types';

const KIND_VALUES = Object.values(MemoryKind);

interface IArgs {
  npcId: string;
  summary: string;
  kind: MemoryKind;
  playerId?: string | null;
  importance?: number;
}

const isMemoryKind = (value: unknown): value is MemoryKind =>
  typeof value === 'string' && KIND_VALUES.includes(value as MemoryKind);

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы воспоминания обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');
  if (typeof raw.summary !== 'string' || !raw.summary.trim()) throw new Error('summary обязателен.');
  if (!isMemoryKind(raw.kind)) throw new Error('Недопустимый тип воспоминания.');

  let importance: number | undefined;
  if (raw.importance !== undefined && raw.importance !== null) {
    if (typeof raw.importance !== 'number' || !Number.isInteger(raw.importance))
      throw new Error('importance должен быть целым числом.');
    importance = raw.importance;
  }

  let playerId: string | null | undefined;
  if (raw.playerId === undefined) playerId = undefined;
  else if (raw.playerId === null) playerId = null;
  else if (typeof raw.playerId === 'string') playerId = raw.playerId.trim() || null;
  else throw new Error('playerId должен быть строкой.');

  return {
    npcId: raw.npcId.trim(),
    summary: raw.summary.trim(),
    kind: raw.kind,
    playerId,
    importance,
  };
};

export const addNpcMemoryTool: ILlmTool = {
  name: 'add_npc_memory',
  description:
    'Добавляет сжатое воспоминание NPC без смены score отношения. kind: episode | fact | favor | grievance | promise. Используй для фактов, обещаний и эпизодов, которые не меняют отношение сами по себе. Для комплиментов/оскорблений/помощи/ударов — improve_npc_relation / worsen_npc_relation.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID NPC' },
      summary: { type: 'string', description: '1–2 предложения факта' },
      kind: { type: 'string', enum: KIND_VALUES, description: 'Тип воспоминания' },
      playerId: { type: 'string', description: 'ID игрока, если память о нём' },
      importance: { type: 'integer', minimum: 1, maximum: 5, description: 'Важность (по умолчанию 3)' },
    },
    required: ['npcId', 'summary', 'kind'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return createNpcMemoryForAgent(
      {
        npcId: parsed.npcId,
        summary: parsed.summary,
        kind: parsed.kind,
        playerId: parsed.playerId ?? null,
        ...(parsed.importance !== undefined ? { importance: parsed.importance } : {}),
      },
      ctx.campaignId
    );
  },
};
