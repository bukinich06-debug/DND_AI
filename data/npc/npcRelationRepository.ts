import type { NpcRelation } from '@/generated/client';
import type { INpcRelation, INpcRelationRepository, ISetNpcRelation } from '@/domain/npc';
import { db } from '@/data/shared';

const mapRelation = (row: NpcRelation): INpcRelation => ({
  npcId: row.npcId,
  playerId: row.playerId,
  score: row.score,
  note: row.note,
});

export const npcRelationRepository: INpcRelationRepository = {
  get: async (npcId, playerId) => {
    const row = await db.npcRelation.findUnique({ where: { npcId_playerId: { npcId, playerId } } });
    if (!row) return null;
    return mapRelation(row);
  },

  listByNpcId: async (npcId) => {
    const rows = await db.npcRelation.findMany({ where: { npcId }, orderBy: { playerId: 'asc' } });
    return rows.map(mapRelation);
  },

  upsert: async (input: ISetNpcRelation) => {
    const note = input.note === undefined ? undefined : input.note === null ? null : input.note.trim();
    const row = await db.npcRelation.upsert({
      where: { npcId_playerId: { npcId: input.npcId, playerId: input.playerId } },
      create: {
        npcId: input.npcId,
        playerId: input.playerId,
        score: input.score,
        note: note ?? null,
      },
      update: {
        score: input.score,
        ...(note !== undefined ? { note } : {}),
      },
    });
    return mapRelation(row);
  },

  delete: async (npcId, playerId) => {
    await db.npcRelation.delete({ where: { npcId_playerId: { npcId, playerId } } });
  },
};
