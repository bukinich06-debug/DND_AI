import { MemoryKind } from '@/domain/shared';

export const ImproveRelationReason = {
  compliment: 'compliment',
  help: 'help',
  save: 'save',
} as const;

export type ImproveRelationReason = (typeof ImproveRelationReason)[keyof typeof ImproveRelationReason];

export const WorsenRelationReason = {
  insult: 'insult',
  threat: 'threat',
  attack: 'attack',
} as const;

export type WorsenRelationReason = (typeof WorsenRelationReason)[keyof typeof WorsenRelationReason];

export type RelationChangeReason = ImproveRelationReason | WorsenRelationReason;

interface IRelationReasonRule {
  delta: number;
  memoryKind: MemoryKind;
  importance: number;
}

export const IMPROVE_RELATION_RULES: Record<ImproveRelationReason, IRelationReasonRule> = {
  compliment: { delta: 5, memoryKind: MemoryKind.favor, importance: 2 },
  help: { delta: 20, memoryKind: MemoryKind.favor, importance: 3 },
  save: { delta: 50, memoryKind: MemoryKind.favor, importance: 5 },
};

export const WORSEN_RELATION_RULES: Record<WorsenRelationReason, IRelationReasonRule> = {
  insult: { delta: -10, memoryKind: MemoryKind.grievance, importance: 2 },
  threat: { delta: -25, memoryKind: MemoryKind.grievance, importance: 3 },
  attack: { delta: -50, memoryKind: MemoryKind.grievance, importance: 5 },
};

export const RELATION_CHANGE_RULES: Record<RelationChangeReason, IRelationReasonRule> = {
  ...IMPROVE_RELATION_RULES,
  ...WORSEN_RELATION_RULES,
};
