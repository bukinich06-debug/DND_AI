export interface ICampaign {
  id: string;
  name: string;
  description: string | null;
}

export interface ICreateCampaign {
  name: string;
  description?: string | null;
}

export interface IUpdateCampaign {
  name?: string;
  description?: string | null;
}

export interface ICampaignRepository {
  create: (input: ICreateCampaign) => Promise<ICampaign>;
  getById: (id: string) => Promise<ICampaign | null>;
  list: () => Promise<ICampaign[]>;
  update: (id: string, input: IUpdateCampaign) => Promise<ICampaign>;
  delete: (id: string) => Promise<void>;
}
