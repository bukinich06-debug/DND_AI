import type { NpcLocation } from '@/generated/client';
import type { INpcLocation, INpcLocationRepository, ISetNpcLocation } from '@/domain/npc';
import { db } from '@/data/shared';

const mapLink = (row: NpcLocation): INpcLocation => ({
  npcId: row.npcId,
  locationId: row.locationId,
  role: row.role,
  isPrimary: row.isPrimary,
});

export const npcLocationRepository: INpcLocationRepository = {
  listByNpcId: async (npcId) => {
    const rows = await db.npcLocation.findMany({ where: { npcId } });
    return rows.map(mapLink);
  },

  listByLocationId: async (locationId) => {
    const rows = await db.npcLocation.findMany({ where: { locationId } });
    return rows.map(mapLink);
  },

  set: async (input: ISetNpcLocation) => {
    const isPrimary = input.isPrimary ?? false;

    const row = await db.$transaction(async (tx) => {
      if (isPrimary) await tx.npcLocation.updateMany({ where: { npcId: input.npcId }, data: { isPrimary: false } });

      return tx.npcLocation.upsert({
        where: {
          npcId_locationId: { npcId: input.npcId, locationId: input.locationId },
        },
        create: {
          npcId: input.npcId,
          locationId: input.locationId,
          role: input.role ?? null,
          isPrimary,
        },
        update: {
          ...(input.role !== undefined ? { role: input.role } : {}),
          isPrimary,
        },
      });
    });

    return mapLink(row);
  },

  remove: async (npcId, locationId) => {
    await db.npcLocation.delete({
      where: { npcId_locationId: { npcId, locationId } },
    });
  },
};
