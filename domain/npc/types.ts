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
  shopSpecialtyKey: string | null;
}

export type ICreateNpc = Omit<INpc, 'id' | 'coinsCp' | 'shopSpecialtyKey'> & {
  coinsCp?: number;
  shopSpecialtyKey?: string | null;
};

export type IUpdateNpc = Partial<Omit<ICreateNpc, 'campaignId'>>;

export interface ISearchNpcsByNameParams {
  campaignId: string;
  name: string;
}

export interface INpcRepository {
  create: (input: ICreateNpc) => Promise<INpc>;
  getById: (id: string) => Promise<INpc | null>;
  listByCampaignId: (campaignId: string) => Promise<INpc[]>;
  searchByName: (params: ISearchNpcsByNameParams) => Promise<INpc[]>;
  update: (id: string, input: IUpdateNpc) => Promise<INpc>;
  delete: (id: string) => Promise<void>;
}
