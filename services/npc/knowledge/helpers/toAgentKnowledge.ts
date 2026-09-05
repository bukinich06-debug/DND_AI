import type { INpcKnowledge } from '@/domain/npc';
import { normalizeSkillKey } from '@/domain/player';
import { KnowledgeReveal } from '@/domain/shared';

export interface IPassedCheck {
  skill: string;
  knowledgeId: string | null;
  passed: boolean;
}

type AgentKnowledge = Omit<INpcKnowledge, 'content'> & { content: string | null };

export const toAgentKnowledge = (item: INpcKnowledge, passedCheck?: IPassedCheck): AgentKnowledge => {
  if (item.reveal === KnowledgeReveal.hidden) throw new Error('Знание недоступно.');
  if (item.reveal === KnowledgeReveal.open) return item;
  if (revealsCheck(item, passedCheck)) return item;
  return { ...item, content: null };
};

const revealsCheck = (item: INpcKnowledge, passedCheck?: IPassedCheck) => {
  if (!passedCheck?.passed || item.reveal !== KnowledgeReveal.check) return false;
  if (passedCheck.knowledgeId && passedCheck.knowledgeId === item.id) return true;
  const hint = item.skillHint ? normalizeSkillKey(item.skillHint) : null;
  return Boolean(hint && hint === passedCheck.skill);
};
