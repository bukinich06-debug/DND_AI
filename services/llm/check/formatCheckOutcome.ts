import { skillLabel, type Skill } from '@/domain/player';

export interface ICheckOutcome {
  skill: Skill;
  dc: number;
  d20: number;
  bonus: number;
  total: number;
  passed: boolean;
  knowledgeId: string | null;
}

export const formatCheckOutcome = (outcome: ICheckOutcome): string => {
  const result = outcome.passed ? 'успех' : 'провал';
  const knowledge = outcome.knowledgeId ? ` knowledgeId=${outcome.knowledgeId}.` : '';
  return `Проверка ${skillLabel(outcome.skill)} (${outcome.skill}): d20=${outcome.d20}, бонус ${outcome.bonus >= 0 ? '+' : ''}${outcome.bonus}, сумма ${outcome.total} против Сл ${outcome.dc} — ${result}.${knowledge} Не проси новую проверку. Не возвращай поле check.`;
};
