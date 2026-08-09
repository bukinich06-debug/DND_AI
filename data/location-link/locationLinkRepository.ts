import type { LocationLink } from '@/generated/client';
import type {
  ICreateLocationLink,
  ILocationLink,
  ILocationLinkRepository,
  IUpdateLocationLink,
} from '@/domain/location-link';
import { db } from '@/data/shared';

const mapLink = (row: LocationLink): ILocationLink => ({
  id: row.id,
  campaignId: row.campaignId,
  fromId: row.fromId,
  toId: row.toId,
  days: row.days,
  label: row.label,
});

export const locationLinkRepository: ILocationLinkRepository = {
  create: async (input: ICreateLocationLink) => {
    const row = await db.locationLink.create({
      data: {
        campaignId: input.campaignId,
        fromId: input.fromId,
        toId: input.toId,
        days: input.days,
        label: input.label?.trim() ? input.label.trim() : null,
      },
    });
    return mapLink(row);
  },

  getById: async (id) => {
    const row = await db.locationLink.findUnique({ where: { id } });
    if (!row) return null;
    return mapLink(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.locationLink.findMany({
      where: { campaignId },
      orderBy: { id: 'asc' },
    });
    return rows.map(mapLink);
  },

  update: async (id, input: IUpdateLocationLink) => {
    const row = await db.locationLink.update({
      where: { id },
      data: {
        ...(input.fromId !== undefined ? { fromId: input.fromId } : {}),
        ...(input.toId !== undefined ? { toId: input.toId } : {}),
        ...(input.days !== undefined ? { days: input.days } : {}),
        ...(input.label !== undefined ? { label: input.label?.trim() ? input.label.trim() : null } : {}),
      },
    });
    return mapLink(row);
  },

  delete: async (id) => {
    await db.locationLink.delete({ where: { id } });
  },
};
