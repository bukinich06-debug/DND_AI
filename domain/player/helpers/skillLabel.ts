import type { Skill } from '../constants';
import { SKILL_ALIASES } from '../constants';

export const skillLabel = (skill: Skill): string => {
  const ru = SKILL_ALIASES[skill].find((alias) => /[а-яё]/i.test(alias));
  return ru || SKILL_ALIASES[skill][0] || skill;
};
