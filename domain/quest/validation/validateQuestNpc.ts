import { QuestNpcRole } from '@/domain/shared';
import type { IAddQuestNpc } from '../questNpcTypes';

const roles = new Set<string>(Object.values(QuestNpcRole));

export const validateAddQuestNpc = (input: IAddQuestNpc) => {
  if (!input.questId.trim()) throw new Error('Квест обязателен.');
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  if (!roles.has(input.role)) throw new Error('Неизвестная роль NPC в квесте.');
};
