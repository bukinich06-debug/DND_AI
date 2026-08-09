import type { QuestNpc } from '@/generated/client';
import type { IAddQuestNpc, IQuestNpc, IQuestNpcRepository } from '@/domain/quest';
import type { QuestNpcRole } from '@/domain/shared';
import { db } from '@/data/shared';

const mapLink = (row: QuestNpc): IQuestNpc => ({
  questId: row.questId,
  npcId: row.npcId,
  role: row.role as QuestNpcRole,
});

export const questNpcRepository: IQuestNpcRepository = {
  listByQuestId: async (questId) => {
    const rows = await db.questNpc.findMany({ where: { questId } });
    return rows.map(mapLink);
  },

  add: async (input: IAddQuestNpc) => {
    const row = await db.questNpc.create({
      data: {
        questId: input.questId,
        npcId: input.npcId,
        role: input.role,
      },
    });
    return mapLink(row);
  },

  remove: async (questId, npcId, role) => {
    await db.questNpc.delete({
      where: {
        questId_npcId_role: { questId, npcId, role },
      },
    });
  },
};
