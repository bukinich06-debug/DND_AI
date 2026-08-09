import type { Location } from '@/generated/client';
import { Prisma } from '@/generated/client';
import type { ICreateLocation, ILocation, ILocationRepository, IUpdateLocation } from '@/domain/location';
import type { LocationKind } from '@/domain/shared';
import { db } from '@/data/shared';

const mapLocation = (row: Location): ILocation => ({
  id: row.id,
  campaignId: row.campaignId,
  parentId: row.parentId,
  kind: row.kind as LocationKind,
  name: row.name,
  summary: row.summary,
  description: row.description,
  features: row.features,
  isSecret: row.isSecret,
  tags: row.tags,
});

export const locationRepository: ILocationRepository = {
  create: async (input: ICreateLocation) => {
    const row = await db.location.create({
      data: {
        campaignId: input.campaignId,
        parentId: input.parentId ?? null,
        kind: input.kind,
        name: input.name.trim(),
        summary: input.summary.trim(),
        description: input.description.trim(),
        features: input.features,
        isSecret: input.isSecret ?? false,
        tags: input.tags,
      },
    });
    return mapLocation(row);
  },

  getById: async (id) => {
    const row = await db.location.findUnique({ where: { id } });
    if (!row) return null;
    return mapLocation(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.location.findMany({ where: { campaignId }, orderBy: { name: 'asc' } });
    return rows.map(mapLocation);
  },

  listChildren: async (parentId) => {
    const rows = await db.location.findMany({ where: { parentId }, orderBy: { name: 'asc' } });
    return rows.map(mapLocation);
  },

  update: async (id, input: IUpdateLocation) => {
    const row = await db.location.update({
      where: { id },
      data: {
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.features !== undefined ? { features: input.features } : {}),
        ...(input.isSecret !== undefined ? { isSecret: input.isSecret } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
      },
    });
    return mapLocation(row);
  },

  delete: async (id) => {
    await db.item.updateMany({ where: { locationId: id }, data: { locationId: null } });
    await db.quest.updateMany({ where: { locationId: id }, data: { locationId: null } });
    await db.npcLocation.deleteMany({ where: { locationId: id } });
    await db.locationLink.deleteMany({ where: { OR: [{ fromId: id }, { toId: id }] } });
    await db.player.updateMany({
      where: { travelDestinationId: id },
      data: {
        travelDestinationId: null,
        travelRoute: Prisma.JsonNull,
        travelLegIndex: null,
        travelDaysLeft: null,
      },
    });
    await db.player.updateMany({
      where: { locationId: id },
      data: {
        locationId: null,
        travelDestinationId: null,
        travelRoute: Prisma.JsonNull,
        travelLegIndex: null,
        travelDaysLeft: null,
      },
    });
    await db.location.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await db.location.delete({ where: { id } });
  },
};
