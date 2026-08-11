import { RELATION_SCORE_MAX, RELATION_SCORE_MIN } from '../constants/relationThresholds';

export const clampRelationScore = (score: number) => Math.min(RELATION_SCORE_MAX, Math.max(RELATION_SCORE_MIN, score));

export const applyRelationDelta = (current: number, delta: number) => clampRelationScore(current + delta);
