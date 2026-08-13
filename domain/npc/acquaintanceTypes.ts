export interface INpcAcquaintance {
  npcId: string;
  otherNpcId: string;
  note: string | null;
}

export interface ISetNpcAcquaintance {
  npcId: string;
  otherNpcId: string;
  note?: string | null;
}

export interface INpcAcquaintanceRepository {
  get: (npcId: string, otherNpcId: string) => Promise<INpcAcquaintance | null>;
  listByNpcId: (npcId: string) => Promise<INpcAcquaintance[]>;
  upsert: (input: ISetNpcAcquaintance) => Promise<INpcAcquaintance>;
  delete: (npcId: string, otherNpcId: string) => Promise<void>;
}
