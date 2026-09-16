import { MemoryKind } from '@/domain/shared';
import type { ICreateNpcMemory, IUpdateNpcMemory } from '../memoryTypes';

const kinds = new Set<string>(Object.values(MemoryKind));

const MIN_IMPORTANCE = 1;
const MAX_IMPORTANCE = 5;

const assertKind = (kind: string) => {
  if (!kinds.has(kind)) throw new Error('Неизвестный тип воспоминания.');
};

const assertImportance = (importance: number) => {
  if (!Number.isInteger(importance)) throw new Error('Важность должна быть целым числом.');
  if (importance < MIN_IMPORTANCE || importance > MAX_IMPORTANCE)
    throw new Error(`Важность должна быть от ${MIN_IMPORTANCE} до ${MAX_IMPORTANCE}.`);
};

const assertOptionalId = (value: string | null | undefined, label: string) => {
  if (value !== undefined && value !== null && !value.trim()) throw new Error(`${label} не может быть пустой строкой.`);
};

export const validateCreateNpcMemory = (input: ICreateNpcMemory) => {
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  if (!input.summary.trim()) throw new Error('Содержание воспоминания обязательно.');
  assertKind(input.kind);
  if (input.importance !== undefined) assertImportance(input.importance);
  assertOptionalId(input.playerId, 'Игрок');
  assertOptionalId(input.aboutNpcId, 'Субъект воспоминания');
};

export const validateUpdateNpcMemory = (input: IUpdateNpcMemory) => {
  if (input.summary !== undefined && !input.summary.trim()) throw new Error('Содержание воспоминания обязательно.');
  if (input.kind !== undefined) assertKind(input.kind);
  if (input.importance !== undefined) assertImportance(input.importance);
  assertOptionalId(input.playerId, 'Игрок');
  assertOptionalId(input.aboutNpcId, 'Субъект воспоминания');
};
