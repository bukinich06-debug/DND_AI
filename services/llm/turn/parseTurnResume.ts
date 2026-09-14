import type { IPlanStep } from '@/services/llm/plan/parsePlanReply';
import type { ITurnResume } from './types';

const asPlanStep = (value: unknown, index: number): IPlanStep => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`remainingSteps[${index}] некорректен.`);
  const obj = value as Record<string, unknown>;

  if (obj.agent === 'npc') {
    if (typeof obj.npcId !== 'string' || !obj.npcId.trim())
      throw new Error(`remainingSteps[${index}].npcId обязателен.`);
    if (typeof obj.npcName !== 'string' || !obj.npcName.trim())
      throw new Error(`remainingSteps[${index}].npcName обязателен.`);
    return { agent: 'npc', npcId: obj.npcId.trim(), npcName: obj.npcName.trim() };
  }

  if (obj.agent === 'master') return { agent: 'master' };
  throw new Error(`remainingSteps[${index}].agent должен быть npc или master.`);
};

export const parseTurnResume = (value: unknown): ITurnResume => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('resume обязателен.');
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.remainingSteps)) throw new Error('resume.remainingSteps должен быть массивом.');
  const remainingSteps = obj.remainingSteps.map((item, index) => asPlanStep(item, index));

  if (obj.agent === 'npc') {
    if (typeof obj.npcId !== 'string' || !obj.npcId.trim()) throw new Error('resume.npcId обязателен.');
    return { agent: 'npc', npcId: obj.npcId.trim(), remainingSteps };
  }

  if (obj.agent === 'master') return { agent: 'master', remainingSteps };
  throw new Error('resume.agent должен быть npc или master.');
};
