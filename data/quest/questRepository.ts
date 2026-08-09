import type { Quest } from '@/generated/client';
import type { ICreateQuest, IQuest, IQuestRepository, IUpdateQuest } from '@/domain/quest';
import type { QuestStatus } from '@/domain/shared';
import { db } from '@/data/shared';

const mapQuest = (row: Quest): IQuest => ({
  id: row.id,
  campaignId: row.campaignId,
  title: row.title,
  description: row.description,
  status: row.status as QuestStatus,
  locationId: row.locationId,
});

export const questRepository: IQuestRepository = {
  create: async (input: ICreateQuest) => {
    const row = await db.quest.create({
      data: {
        campaignId: input.campaignId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status ?? 'available',
        locationId: input.locationId ?? null,
      },
    });
    return mapQuest(row);
  },

  getById: async (id) => {
    const row = await db.quest.findUnique({ where: { id } });
    if (!row) return null;
    return mapQuest(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.quest.findMany({ where: { campaignId }, orderBy: { title: 'asc' } });
    return rows.map(mapQuest);
  },

  update: async (id, input: IUpdateQuest) => {
    const row = await db.quest.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
      },
    });
    return mapQuest(row);
  },

  delete: async (id) => {
    await db.$transaction(async (tx) => {
      await tx.questNpc.deleteMany({ where: { questId: id } });
      await tx.npcKnowledge.updateMany({ where: { questId: id }, data: { questId: null } });
      await tx.quest.delete({ where: { id } });
    });
  },
};
