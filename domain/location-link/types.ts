export interface ILocationLink {
  id: string;
  campaignId: string;
  fromId: string;
  toId: string;
  days: number;
  label: string | null;
}

export type ICreateLocationLink = Omit<ILocationLink, 'id' | 'label'> & {
  label?: string | null;
};

export type IUpdateLocationLink = Partial<Omit<ICreateLocationLink, 'campaignId'>>;

export interface ILocationLinkRepository {
  create: (input: ICreateLocationLink) => Promise<ILocationLink>;
  getById: (id: string) => Promise<ILocationLink | null>;
  listByCampaignId: (campaignId: string) => Promise<ILocationLink[]>;
  update: (id: string, input: IUpdateLocationLink) => Promise<ILocationLink>;
  delete: (id: string) => Promise<void>;
}
