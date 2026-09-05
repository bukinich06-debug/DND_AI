import type { Skill } from '../constants';
import { Skill as SkillKey } from '../constants';

export type AbilityKey = 'str' | 'dex' | 'int' | 'wis' | 'cha';

export const SKILL_ABILITY: Record<Skill, AbilityKey> = {
  [SkillKey.athletics]: 'str',
  [SkillKey.acrobatics]: 'dex',
  [SkillKey.sleightOfHand]: 'dex',
  [SkillKey.stealth]: 'dex',
  [SkillKey.arcana]: 'int',
  [SkillKey.history]: 'int',
  [SkillKey.investigation]: 'int',
  [SkillKey.nature]: 'int',
  [SkillKey.religion]: 'int',
  [SkillKey.animalHandling]: 'wis',
  [SkillKey.insight]: 'wis',
  [SkillKey.medicine]: 'wis',
  [SkillKey.perception]: 'wis',
  [SkillKey.survival]: 'wis',
  [SkillKey.deception]: 'cha',
  [SkillKey.intimidation]: 'cha',
  [SkillKey.performance]: 'cha',
  [SkillKey.persuasion]: 'cha',
};
