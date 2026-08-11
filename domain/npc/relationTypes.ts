export interface INpcRelation {
  npcId: string;
  playerId: string;
  score: number;
  note: string | null;
}

export interface ISetNpcRelation {
  npcId: string;
  playerId: string;
  score: number;
  note?: string | null;
}

export interface INpcRelationRepository {
  get: (npcId: string, playerId: string) => Promise<INpcRelation | null>;
  listByNpcId: (npcId: string) => Promise<INpcRelation[]>;
  upsert: (input: ISetNpcRelation) => Promise<INpcRelation>;
  delete: (npcId: string, playerId: string) => Promise<void>;
}
