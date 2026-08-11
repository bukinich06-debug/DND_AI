import { ImproveRelationReason, isImproveRelationReason } from '@/domain/npc';
import { applyNpcRelationChange } from '@/services/npc/relation/applyNpcRelationChange';
import type { ILlmTool, IToolContext } from './types';

const REASON_VALUES = Object.values(ImproveRelationReason);

interface IArgs {
  npcId: string;
  playerId: string;
  reason: ImproveRelationReason;
  summary: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы улучшения отношения обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('playerId обязателен.');
  if (typeof raw.reason !== 'string' || !isImproveRelationReason(raw.reason))
    throw new Error('Недопустимая причина улучшения отношения.');
  if (typeof raw.summary !== 'string' || !raw.summary.trim()) throw new Error('summary обязателен.');
  return {
    npcId: raw.npcId.trim(),
    playerId: raw.playerId.trim(),
    reason: raw.reason,
    summary: raw.summary.trim(),
  };
};

export const improveNpcRelationTool: ILlmTool = {
  name: 'improve_npc_relation',
  description:
    'Улучшает отношение NPC к игроку после позитивного поступка. reason задаёт величину: compliment (+5), help (+20), save (+50). Всегда передай краткий summary (что сделал игрок) — сохранится в память NPC. Не передавай свою цифру score.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID NPC' },
      playerId: { type: 'string', description: 'ID игрока' },
      reason: {
        type: 'string',
        enum: REASON_VALUES,
        description: 'compliment | help | save',
      },
      summary: {
        type: 'string',
        description: 'Кратко: что сделал игрок',
      },
    },
    required: ['npcId', 'playerId', 'reason', 'summary'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return applyNpcRelationChange({ ...parsed, campaignId: ctx.campaignId });
  },
};
