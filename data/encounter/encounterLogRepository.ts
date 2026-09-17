import type { EncounterLog } from '@/generated/client';
import type { ICreateEncounterLog, IEncounterLog, IEncounterLogRepository } from '@/domain/encounter';
import { db } from '@/data/shared';
import { Prisma } from '@/generated/client';

const mapLog = (row: EncounterLog): IEncounterLog => ({
  id: row.id,
  encounterId: row.encounterId,
  actorName: row.actorName,
  message: row.message,
  meta: row.meta,
  createdAt: row.createdAt,
});

export const encounterLogRepository: IEncounterLogRepository = {
  create: async (input: ICreateEncounterLog) => {
    const row = await db.encounterLog.create({
      data: {
        encounterId: input.encounterId,
        actorName: input.actorName ?? null,
        message: input.message,
        meta: input.meta !== undefined ? (input.meta as Prisma.InputJsonValue) : Prisma.JsonNull,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      },
    });
    return mapLog(row);
  },

  listByEncounterId: async (encounterId) => {
    const rows = await db.encounterLog.findMany({
      where: { encounterId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapLog);
  },
};
