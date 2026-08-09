import type { Npc } from '@/generated/client';
import type { ICreateNpc, INpc, INpcRepository, IUpdateNpc } from '@/domain/npc';
import { db } from '@/data/shared';

const mapNpc = (row: Npc): INpc => ({
  id: row.id,
  campaignId: row.campaignId,
  name: row.name,
  title: row.title,
  appearance: row.appearance,
  personality: row.personality,
  speech: row.speech,
  habits: row.habits,
  attitude: row.attitude,
  dmNotes: row.dmNotes,
  coinsCp: row.coinsCp,
});

export const npcRepository: INpcRepository = {
  create: async (input: ICreateNpc) => {
    const row = await db.npc.create({
      data: {
        campaignId: input.campaignId,
        name: input.name.trim(),
        title: input.title ?? null,
        appearance: input.appearance.trim(),
        personality: input.personality.trim(),
        speech: input.speech.trim(),
        habits: input.habits.trim(),
        attitude: input.attitude ?? null,
        dmNotes: input.dmNotes ?? null,
        coinsCp: input.coinsCp ?? 0,
      },
    });
    return mapNpc(row);
  },

  getById: async (id) => {
    const row = await db.npc.findUnique({ where: { id } });
    if (!row) return null;
    return mapNpc(row);
  },

  listByCampaignId: async (campaignId) => {
    const rows = await db.npc.findMany({ where: { campaignId }, orderBy: { name: 'asc' } });
    return rows.map(mapNpc);
  },

  update: async (id, input: IUpdateNpc) => {
    const row = await db.npc.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.appearance !== undefined ? { appearance: input.appearance.trim() } : {}),
        ...(input.personality !== undefined ? { personality: input.personality.trim() } : {}),
        ...(input.speech !== undefined ? { speech: input.speech.trim() } : {}),
        ...(input.habits !== undefined ? { habits: input.habits.trim() } : {}),
        ...(input.attitude !== undefined ? { attitude: input.attitude } : {}),
        ...(input.dmNotes !== undefined ? { dmNotes: input.dmNotes } : {}),
        ...(input.coinsCp !== undefined ? { coinsCp: input.coinsCp } : {}),
      },
    });
    return mapNpc(row);
  },

  delete: async (id) => {
    await db.$transaction(async (tx) => {
      await tx.questNpc.deleteMany({ where: { npcId: id } });
      await tx.npcKnowledge.deleteMany({ where: { npcId: id } });
      await tx.npcLocation.deleteMany({ where: { npcId: id } });
      await tx.npcStatBlock.deleteMany({ where: { npcId: id } });
      await tx.item.updateMany({ where: { npcId: id }, data: { npcId: null } });
      await tx.npc.delete({ where: { id } });
    });
  },
};
