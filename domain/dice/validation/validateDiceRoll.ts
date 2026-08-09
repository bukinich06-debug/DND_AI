import { DiceKind } from '@/domain/shared';
import type { IRollDice } from '../types';

const isDiceKind = (value: string): value is DiceKind => value in DiceKind;

export const validateRollDice = (input: IRollDice) => {
  if (!input.campaignId?.trim()) throw new Error('Кампания обязательна.');
  if (!input.die || !isDiceKind(input.die)) throw new Error('Недопустимый тип кубика.');

  if (input.playerId && input.npcId) throw new Error('Укажите либо игрока, либо NPC, не обоих.');

  if (input.note !== undefined && input.note !== null && !input.note.trim())
    throw new Error('Заметка не может быть пустой.');
};
