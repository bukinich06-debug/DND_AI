import type { QuestStatus } from '@/domain/shared';

export interface IQuest {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  status: QuestStatus;
  locationId: string | null;
}

export type ICreateQuest = Omit<IQuest, 'id' | 'status'> & {
  status?: QuestStatus;
};

export type IUpdateQuest = Partial<Omit<ICreateQuest, 'campaignId'>>;

export interface IQuestRepository {
  create: (input: ICreateQuest) => Promise<IQuest>;
  getById: (id: string) => Promise<IQuest | null>;
  listByCampaignId: (campaignId: string) => Promise<IQuest[]>;
  update: (id: string, input: IUpdateQuest) => Promise<IQuest>;
  delete: (id: string) => Promise<void>;
}
