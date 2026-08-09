import { KnowledgeReveal } from '@/domain/shared';
import type { ICreateNpcKnowledge, IUpdateNpcKnowledge } from '../knowledgeTypes';

const reveals = new Set<string>(Object.values(KnowledgeReveal));

const assertRevealRules = (reveal: string, dc: number | null | undefined) => {
  if (!reveals.has(reveal)) throw new Error('Неизвестный уровень раскрытия знания.');
  if (reveal === KnowledgeReveal.check && (dc === null || dc === undefined))
    throw new Error('Для знания под проверкой укажите DC.');
  if (dc !== null && dc !== undefined && dc < 1) throw new Error('DC должен быть не меньше 1.');
};

export const validateCreateNpcKnowledge = (input: ICreateNpcKnowledge) => {
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  if (!input.title.trim()) throw new Error('Заголовок знания обязателен.');
  if (!input.content.trim()) throw new Error('Содержание знания обязательно.');
  assertRevealRules(input.reveal, input.dc);
};

export const validateUpdateNpcKnowledge = (
  input: IUpdateNpcKnowledge,
  current: { reveal: string; dc: number | null }
) => {
  if (input.title !== undefined && !input.title.trim()) throw new Error('Заголовок знания обязателен.');
  if (input.content !== undefined && !input.content.trim()) throw new Error('Содержание знания обязательно.');
  const reveal = input.reveal ?? current.reveal;
  const dc = input.dc !== undefined ? input.dc : current.dc;
  assertRevealRules(reveal, dc);
};
