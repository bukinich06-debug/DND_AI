import type { TimeOfDay } from '@/domain/shared';

export interface ICampaign {
  id: string;
  name: string;
  description: string | null;
  dayIndex: number;
  timeOfDay: TimeOfDay;
}

export interface ICreateCampaign {
  name: string;
  description?: string | null;
}

export interface IUpdateCampaign {
  name?: string;
  description?: string | null;
  dayIndex?: number;
  timeOfDay?: TimeOfDay;
}

export interface ICampaignRepository {
  create: (input: ICreateCampaign) => Promise<ICampaign>;
  getById: (id: string) => Promise<ICampaign | null>;
  list: () => Promise<ICampaign[]>;
  update: (id: string, input: IUpdateCampaign) => Promise<ICampaign>;
  delete: (id: string) => Promise<void>;
}
