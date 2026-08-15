import type { LocationKind } from '@/domain/shared';

export interface ILocation {
  id: string;
  campaignId: string;
  parentId: string | null;
  kind: LocationKind;
  name: string;
  summary: string;
  description: string;
  features: string;
  isSecret: boolean;
  tags: string[];
}

export type ICreateLocation = Omit<ILocation, 'id' | 'isSecret'> & {
  isSecret?: boolean;
};

export type IUpdateLocation = Partial<Omit<ICreateLocation, 'campaignId'>>;

export interface ISearchLocationsByNameParams {
  campaignId: string;
  name: string;
}

export interface ILocationRepository {
  create: (input: ICreateLocation) => Promise<ILocation>;
  getById: (id: string) => Promise<ILocation | null>;
  listByCampaignId: (campaignId: string) => Promise<ILocation[]>;
  listChildren: (parentId: string) => Promise<ILocation[]>;
  searchByName: (params: ISearchLocationsByNameParams) => Promise<ILocation[]>;
  update: (id: string, input: IUpdateLocation) => Promise<ILocation>;
  delete: (id: string) => Promise<void>;
}
