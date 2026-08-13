import type { NpcAcquaintance } from '@/generated/client';
import type {
  INpcAcquaintance,
  INpcAcquaintanceRepository,
  ISetNpcAcquaintance,
} from '@/domain/npc';
import { db } from '@/data/shared';

const mapAcquaintance = (row: NpcAcquaintance): INpcAcquaintance => ({
  npcId: row.npcId,
  otherNpcId: row.otherNpcId,
  note: row.note,
});

export const npcAcquaintanceRepository: INpcAcquaintanceRepository = {
  get: async (npcId, otherNpcId) => {
    const row = await db.npcAcquaintance.findUnique({
      where: { npcId_otherNpcId: { npcId, otherNpcId } },
    });
    if (!row) return null;
    return mapAcquaintance(row);
  },

  listByNpcId: async (npcId) => {
    const rows = await db.npcAcquaintance.findMany({
      where: { npcId },
      orderBy: { otherNpcId: 'asc' },
    });
    return rows.map(mapAcquaintance);
  },

  upsert: async (input: ISetNpcAcquaintance) => {
    const note = input.note === undefined ? undefined : input.note === null ? null : input.note.trim();
    const row = await db.npcAcquaintance.upsert({
      where: { npcId_otherNpcId: { npcId: input.npcId, otherNpcId: input.otherNpcId } },
      create: {
        npcId: input.npcId,
        otherNpcId: input.otherNpcId,
        note: note ?? null,
      },
      update: {
        ...(note !== undefined ? { note } : {}),
      },
    });
    return mapAcquaintance(row);
  },

  delete: async (npcId, otherNpcId) => {
    await db.npcAcquaintance.delete({
      where: { npcId_otherNpcId: { npcId, otherNpcId } },
    });
  },
};
