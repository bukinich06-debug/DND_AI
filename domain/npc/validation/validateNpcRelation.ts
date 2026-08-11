import { RELATION_SCORE_MAX, RELATION_SCORE_MIN } from '../constants/relationThresholds';
import type { ISetNpcRelation } from '../relationTypes';

export const validateSetNpcRelation = (input: ISetNpcRelation) => {
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  if (!input.playerId.trim()) throw new Error('Игрок обязателен.');
  if (!Number.isInteger(input.score)) throw new Error('Очки отношения должны быть целым числом.');
  if (input.score < RELATION_SCORE_MIN || input.score > RELATION_SCORE_MAX)
    throw new Error(`Очки отношения должны быть от ${RELATION_SCORE_MIN} до ${RELATION_SCORE_MAX}.`);
  if (input.note !== undefined && input.note !== null && !input.note.trim())
    throw new Error('Заметка отношения не может быть пустой строкой.');
};
