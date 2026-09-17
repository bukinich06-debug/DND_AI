export interface IEncounter {
  id: string;
  campaignId: string;
  status: 'active' | 'ended';
  round: number;
  currentTurnIndex: number;
  locationId: string | null;
}

export type ICreateEncounter = Omit<IEncounter, 'id' | 'round' | 'currentTurnIndex' | 'status'> & {
  status?: 'active' | 'ended';
  round?: number;
  currentTurnIndex?: number;
};

export type IUpdateEncounter = Partial<Omit<ICreateEncounter, 'campaignId'>>;

export interface IEncounterRepository {
  create: (input: ICreateEncounter) => Promise<IEncounter>;
  getById: (id: string) => Promise<IEncounter | null>;
  getActiveByCampaignId: (campaignId: string) => Promise<IEncounter | null>;
  listByCampaignId: (campaignId: string) => Promise<IEncounter[]>;
  update: (id: string, input: IUpdateEncounter) => Promise<IEncounter>;
  delete: (id: string) => Promise<void>;
}

export interface IEncounterParticipant {
  id: string;
  encounterId: string;
  initiative: number;
  order: number;
  isOut: boolean;
  feetFromPlayer: number;
  playerId: string | null;
  npcId: string | null;
  monsterInstanceId: string | null;
}

export type ICreateEncounterParticipant = Omit<IEncounterParticipant, 'id' | 'isOut' | 'feetFromPlayer'> & {
  isOut?: boolean;
  feetFromPlayer?: number;
};

export type IUpdateEncounterParticipant = Partial<Omit<ICreateEncounterParticipant, 'encounterId'>>;

export interface IEncounterParticipantRepository {
  create: (input: ICreateEncounterParticipant) => Promise<IEncounterParticipant>;
  getById: (id: string) => Promise<IEncounterParticipant | null>;
  listByEncounterId: (encounterId: string) => Promise<IEncounterParticipant[]>;
  update: (id: string, input: IUpdateEncounterParticipant) => Promise<IEncounterParticipant>;
  delete: (id: string) => Promise<void>;
}
