export interface INpc {
  id: string;
  campaignId: string;
  name: string;
  title: string | null;
  appearance: string;
  personality: string;
  speech: string;
  habits: string;
  attitude: string | null;
  dmNotes: string | null;
  coinsCp: number;
}

export type ICreateNpc = Omit<INpc, 'id' | 'coinsCp'> & {
  coinsCp?: number;
};

export type IUpdateNpc = Partial<Omit<ICreateNpc, 'campaignId'>>;

export interface INpcRepository {
  create: (input: ICreateNpc) => Promise<INpc>;
  getById: (id: string) => Promise<INpc | null>;
  listByCampaignId: (campaignId: string) => Promise<INpc[]>;
  update: (id: string, input: IUpdateNpc) => Promise<INpc>;
  delete: (id: string) => Promise<void>;
}
