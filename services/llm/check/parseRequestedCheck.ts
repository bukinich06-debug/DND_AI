import { normalizeSkillKey, type Skill } from '@/domain/player';

export interface IRequestedCheck {
  skill: Skill;
  dc: number;
  knowledgeId: string | null;
}

const MIN_DC = 5;
const MAX_DC = 30;

const clampDc = (dc: number) => Math.min(MAX_DC, Math.max(MIN_DC, Math.round(dc)));

export const parseRequestedCheck = (value: unknown): IRequestedCheck | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.skill !== 'string' || !obj.skill.trim()) return null;
  const skill = normalizeSkillKey(obj.skill);
  if (!skill) return null;
  if (typeof obj.dc !== 'number' || !Number.isFinite(obj.dc)) return null;

  let knowledgeId: string | null = null;
  if (obj.knowledgeId !== undefined && obj.knowledgeId !== null) {
    if (typeof obj.knowledgeId !== 'string') return null;
    knowledgeId = obj.knowledgeId.trim() || null;
  }

  return { skill, dc: clampDc(obj.dc), knowledgeId };
};
