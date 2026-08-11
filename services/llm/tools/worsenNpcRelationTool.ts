import { WorsenRelationReason, isWorsenRelationReason } from '@/domain/npc';
import { applyNpcRelationChange } from '@/services/npc/relation/applyNpcRelationChange';
import type { ILlmTool, IToolContext } from './types';

const REASON_VALUES = Object.values(WorsenRelationReason);

interface IArgs {
  npcId: string;
  playerId: string;
  reason: WorsenRelationReason;
  summary: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы ухудшения отношения обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('playerId обязателен.');
  if (typeof raw.reason !== 'string' || !isWorsenRelationReason(raw.reason))
    throw new Error('Недопустимая причина ухудшения отношения.');
  if (typeof raw.summary !== 'string' || !raw.summary.trim()) throw new Error('summary обязателен.');
  return {
    npcId: raw.npcId.trim(),
    playerId: raw.playerId.trim(),
    reason: raw.reason,
    summary: raw.summary.trim(),
  };
};

export const worsenNpcRelationTool: ILlmTool = {
  name: 'worsen_npc_relation',
  description:
    'Ухудшает отношение NPC к игроку после негативного поступка. reason задаёт величину: insult (−10), threat (−25), attack (−50). Всегда передай краткий summary — сохранится в память NPC. Не передавай свою цифру score.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID NPC' },
      playerId: { type: 'string', description: 'ID игрока' },
      reason: {
        type: 'string',
        enum: REASON_VALUES,
        description: 'insult | threat | attack',
      },
      summary: {
        type: 'string',
        description: 'Кратко: чем обидел игрок',
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
