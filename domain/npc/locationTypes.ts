export interface INpcLocation {
  npcId: string;
  locationId: string;
  role: string | null;
  isPrimary: boolean;
}

export interface ISetNpcLocation {
  npcId: string;
  locationId: string;
  role?: string | null;
  isPrimary?: boolean;
}

export interface INpcLocationRepository {
  listByNpcId: (npcId: string) => Promise<INpcLocation[]>;
  set: (input: ISetNpcLocation) => Promise<INpcLocation>;
  remove: (npcId: string, locationId: string) => Promise<void>;
}
