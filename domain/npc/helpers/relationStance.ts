import {
  RELATION_COLD_MAX,
  RELATION_HOSTILE_MAX,
  RELATION_NEUTRAL_MAX,
  RELATION_WARM_MAX,
} from '../constants/relationThresholds';

export type RelationStance = 'hostile' | 'cold' | 'neutral' | 'warm' | 'devoted';

export const relationStance = (score: number): RelationStance => {
  if (score <= RELATION_HOSTILE_MAX) return 'hostile';
  if (score <= RELATION_COLD_MAX) return 'cold';
  if (score <= RELATION_NEUTRAL_MAX) return 'neutral';
  if (score <= RELATION_WARM_MAX) return 'warm';
  return 'devoted';
};
