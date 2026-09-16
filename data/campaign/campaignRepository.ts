import type { Campaign } from '@/generated/client';
import type { ICampaign, ICampaignRepository, ICreateCampaign, IUpdateCampaign } from '@/domain/campaign';
import type { TimeOfDay } from '@/domain/shared';
import { db } from '@/data/shared';

const mapCampaign = (row: Campaign): ICampaign => ({
  id: row.id,
  name: row.name,
  description: row.description,
  dayIndex: row.dayIndex,
  timeOfDay: row.timeOfDay as TimeOfDay,
});

export const campaignRepository: ICampaignRepository = {
  create: async (input: ICreateCampaign) => {
    const row = await db.campaign.create({
      data: {
        name: input.name.trim(),
        description: input.description ?? null,
      },
    });
    return mapCampaign(row);
  },

  getById: async (id) => {
    const row = await db.campaign.findUnique({ where: { id } });
    if (!row) return null;
    return mapCampaign(row);
  },

  list: async () => {
    const rows = await db.campaign.findMany({ orderBy: { name: 'asc' } });
    return rows.map(mapCampaign);
  },

  update: async (id, input: IUpdateCampaign) => {
    const row = await db.campaign.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.dayIndex !== undefined ? { dayIndex: input.dayIndex } : {}),
        ...(input.timeOfDay !== undefined ? { timeOfDay: input.timeOfDay } : {}),
      },
    });
    return mapCampaign(row);
  },

  delete: async (id) => {
    await db.$transaction(async (tx) => {
      const npcs = await tx.npc.findMany({ where: { campaignId: id }, select: { id: true } });
      const npcIds = npcs.map((n) => n.id);

      const quests = await tx.quest.findMany({ where: { campaignId: id }, select: { id: true } });
      const questIds = quests.map((q) => q.id);

      if (questIds.length) {
        await tx.questNpc.deleteMany({ where: { questId: { in: questIds } } });
        await tx.npcKnowledge.deleteMany({ where: { questId: { in: questIds } } });
      }

      if (npcIds.length) {
        await tx.questNpc.deleteMany({ where: { npcId: { in: npcIds } } });
        await tx.npcKnowledge.deleteMany({ where: { npcId: { in: npcIds } } });
        await tx.npcLocation.deleteMany({ where: { npcId: { in: npcIds } } });
        await tx.npcStatBlock.deleteMany({ where: { npcId: { in: npcIds } } });
      }

      await tx.worldEvent.deleteMany({ where: { campaignId: id } });
      await tx.item.deleteMany({ where: { campaignId: id } });
      await tx.quest.deleteMany({ where: { campaignId: id } });
      await tx.monsterInstance.deleteMany({ where: { campaignId: id } });
      await tx.npc.deleteMany({ where: { campaignId: id } });
      await tx.player.deleteMany({ where: { campaignId: id } });
      await tx.locationLink.deleteMany({ where: { campaignId: id } });
      await tx.location.updateMany({ where: { campaignId: id }, data: { parentId: null } });
      await tx.location.deleteMany({ where: { campaignId: id } });
      await tx.campaign.delete({ where: { id } });
    });
  },
};
