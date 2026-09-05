import type { Skill } from '../constants';
import type { IPlayer } from '../types';
import { abilityMod } from './abilityMod';
import { SKILL_ABILITY } from './skillAbility';

type AbilityScoreFields = 'str' | 'dex' | 'int' | 'wis' | 'cha';

type ISkillSheet = Pick<IPlayer, AbilityScoreFields | 'proficiencyBonus' | 'skillProf' | 'skillExpertise'>;

export const skillBonus = (player: ISkillSheet, skill: Skill): number => {
  const mod = abilityMod(player[SKILL_ABILITY[skill]]);
  if (player.skillExpertise.includes(skill)) return mod + player.proficiencyBonus * 2;
  if (player.skillProf.includes(skill)) return mod + player.proficiencyBonus;
  return mod;
};
