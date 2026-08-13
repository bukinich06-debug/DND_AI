import type { MemoryKind } from '@/domain/shared';

export interface INpcMemory {
  id: string;
  npcId: string;
  playerId: string | null;
  aboutNpcId: string | null;
  summary: string;
  kind: MemoryKind;
  importance: number;
}

export type ICreateNpcMemory = Omit<INpcMemory, 'id' | 'importance'> & {
  importance?: number;
};

export type IUpdateNpcMemory = Partial<Omit<ICreateNpcMemory, 'npcId'>>;

export interface IListNpcMemoriesFilter {
  playerId?: string | null;
  minImportance?: number;
}

export interface INpcMemoryRepository {
  create: (input: ICreateNpcMemory) => Promise<INpcMemory>;
  getById: (id: string) => Promise<INpcMemory | null>;
  listByNpcId: (npcId: string, filter?: IListNpcMemoriesFilter) => Promise<INpcMemory[]>;
  update: (id: string, input: IUpdateNpcMemory) => Promise<INpcMemory>;
  delete: (id: string) => Promise<void>;
}
