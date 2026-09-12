import type { Tool } from '../constants';
import type { IPlayer } from '../types';
import { abilityMod } from './abilityMod';
import { TOOL_ABILITY } from './toolAbility';

type AbilityScoreFields = 'str' | 'dex' | 'int' | 'wis' | 'cha';

type IToolSheet = Pick<IPlayer, AbilityScoreFields | 'proficiencyBonus' | 'toolProf'>;

export const toolBonus = (player: IToolSheet, tool: Tool): number => {
  const mod = abilityMod(player[TOOL_ABILITY[tool]]);
  if (player.toolProf.includes(tool)) return mod + player.proficiencyBonus;
  return mod;
};
