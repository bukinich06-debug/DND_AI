import { ensureNpcAcquaintance } from '@/services/npc/acquaintance/ensureNpcAcquaintance';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  otherNpcId: string;
  note?: string | null;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы знакомства обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.otherNpcId !== 'string' || !raw.otherNpcId.trim()) throw new Error('otherNpcId обязателен.');

  let note: string | null | undefined;
  if (raw.note === undefined) note = undefined;
  else if (raw.note === null) note = null;
  else if (typeof raw.note === 'string') note = raw.note.trim() || null;
  else throw new Error('note должен быть строкой.');

  return { otherNpcId: raw.otherNpcId.trim(), note };
};

export const ensureNpcAcquaintanceTool: ILlmTool = {
  name: 'ensure_npc_acquaintance',
  description: 'Гарантирует запись «speaker (ctx.npcId) знает otherNpc». Вызывай после search_npc, если NPC уже есть.',
  parameters: {
    type: 'object',
    properties: {
      otherNpcId: { type: 'string', description: 'ID знакомого NPC' },
      note: { type: 'string', description: 'Как знакомы' },
    },
    required: ['otherNpcId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    if (!ctx.npcId?.trim()) throw new Error('npcId спикера обязателен в контексте.');
    const parsed = parseArgs(args);
    return ensureNpcAcquaintance({
      npcId: ctx.npcId.trim(),
      otherNpcId: parsed.otherNpcId,
      ...(parsed.note !== undefined ? { note: parsed.note } : {}),
    });
  },
};
