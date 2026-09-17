import type { Encounter } from '@/generated/client';
import type {
  ICreateEncounter,
  IEncounter,
  IEncounterRepository,
  IUpdateEncounter,
} from '@/domain/encounter';
import { db } from '@/data/shared';

const mapEncounter = (row: Encounter): IEncounter => ({
  id: row.id,
  campaignId: row.campaignId,
  status: row.status,
  round: row.round,
  currentTurnIndex: row.currentTurnIndex,
  locationId: row.locationId,
});

export const encounterRepository: IEncounterRepository = {
  create: async (input: ICreateEncounter) => {
    const existingActive = await db.encounter.findFirst({
      where: { campaignId: input.campaignId, status: 'active' },
    });
    if (existingActive) throw new Error('Активная боевая сцена уже существует в этой кампании.');

    const row = await db.encounter.create({
      data: {
        campaignId: input.campaignId,
        status: input.status ?? 'active',
        round: input.round ?? 1,
        currentTurnIndex: input.currentTurnIndex ?? 0,
        locationId: input.locationId ?? null,
      },
    });
    return mapEncounter(row);
  },

  getById: async (id) => {
    const row = await db.encounter.findUnique({ where: { id } });
    if (!row) return null;
    return mapEncounter(row);
  },

  getActiveByCampaignId: async (campaignId) => {
    const row = await db.encounter.findFirst({
      where: { campaignId, status: 'active' },
    });
    if (!row) return null;
    return mapEncounter(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.encounter.findMany({
      where: { campaignId },
      orderBy: { id: 'desc' },
    });
    return rows.map(mapEncounter);
  },

  update: async (id, input: IUpdateEncounter) => {
    const row = await db.encounter.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.round !== undefined ? { round: input.round } : {}),
        ...(input.currentTurnIndex !== undefined ? { currentTurnIndex: input.currentTurnIndex } : {}),
        ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
      },
    });
    return mapEncounter(row);
  },

  delete: async (id) => {
    await db.encounter.delete({ where: { id } });
  },
};
