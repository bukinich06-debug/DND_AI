import type { QuestNpcRole } from '@/domain/shared';

export interface IQuestNpc {
  questId: string;
  npcId: string;
  role: QuestNpcRole;
}

export interface IAddQuestNpc {
  questId: string;
  npcId: string;
  role: QuestNpcRole;
}

export interface IQuestNpcRepository {
  listByQuestId: (questId: string) => Promise<IQuestNpc[]>;
  add: (input: IAddQuestNpc) => Promise<IQuestNpc>;
  remove: (questId: string, npcId: string, role: QuestNpcRole) => Promise<void>;
}
