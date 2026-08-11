import {
  IMPROVE_RELATION_RULES,
  RELATION_CHANGE_RULES,
  WORSEN_RELATION_RULES,
  type ImproveRelationReason,
  type RelationChangeReason,
  type WorsenRelationReason,
} from '../constants/relationReasons';

export interface INpcRelationChangeInput {
  npcId: string;
  playerId: string;
  reason: RelationChangeReason;
  summary: string;
}

const improveReasons = new Set<string>(Object.keys(IMPROVE_RELATION_RULES));
const worsenReasons = new Set<string>(Object.keys(WORSEN_RELATION_RULES));
const allReasons = new Set<string>(Object.keys(RELATION_CHANGE_RULES));

export const isImproveRelationReason = (value: string): value is ImproveRelationReason => improveReasons.has(value);

export const isWorsenRelationReason = (value: string): value is WorsenRelationReason => worsenReasons.has(value);

export const isRelationChangeReason = (value: string): value is RelationChangeReason => allReasons.has(value);

export const validateNpcRelationChange = (input: INpcRelationChangeInput) => {
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!input.summary.trim()) throw new Error('Описание поступка обязательно.');
  if (!isRelationChangeReason(input.reason)) throw new Error('Неизвестная причина изменения отношения.');
};
