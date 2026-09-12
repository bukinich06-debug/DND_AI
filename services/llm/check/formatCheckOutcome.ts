import { normalizeSkillKey, skillLabel, toolLabel, type Skill, type Tool } from '@/domain/player';

export interface ICheckOutcome {
  skill: Skill | Tool;
  dc: number;
  d20: number;
  bonus: number;
  total: number;
  passed: boolean;
  knowledgeId: string | null;
}

const checkLabel = (skill: Skill | Tool) => {
  const asSkill = normalizeSkillKey(skill);
  if (asSkill) return skillLabel(asSkill);
  return toolLabel(skill as Tool);
};

export const formatCheckOutcome = (outcome: ICheckOutcome): string => {
  const result = outcome.passed ? 'успех' : 'провал';
  const knowledge = outcome.knowledgeId ? ` knowledgeId=${outcome.knowledgeId}.` : '';
  return `Проверка ${checkLabel(outcome.skill)} (${outcome.skill}): d20=${outcome.d20}, бонус ${outcome.bonus >= 0 ? '+' : ''}${outcome.bonus}, сумма ${outcome.total} против Сл ${outcome.dc} — ${result}.${knowledge} Не проси новую проверку. Не возвращай поле check.`;
};
