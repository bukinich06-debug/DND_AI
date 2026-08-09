import type { NpcKnowledge } from '@/generated/client';
import type { ICreateNpcKnowledge, INpcKnowledge, INpcKnowledgeRepository, IUpdateNpcKnowledge } from '@/domain/npc';
import type { KnowledgeReveal } from '@/domain/shared';
import { db } from '@/data/shared';

const mapKnowledge = (row: NpcKnowledge): INpcKnowledge => ({
  id: row.id,
  npcId: row.npcId,
  title: row.title,
  content: row.content,
  reveal: row.reveal as KnowledgeReveal,
  skillHint: row.skillHint,
  dc: row.dc,
  questId: row.questId,
});

export const npcKnowledgeRepository: INpcKnowledgeRepository = {
  create: async (input: ICreateNpcKnowledge) => {
    const row = await db.npcKnowledge.create({
      data: {
        npcId: input.npcId,
        title: input.title.trim(),
        content: input.content.trim(),
        reveal: input.reveal,
        skillHint: input.skillHint ?? null,
        dc: input.dc ?? null,
        questId: input.questId ?? null,
      },
    });
    return mapKnowledge(row);
  },

  getById: async (id) => {
    const row = await db.npcKnowledge.findUnique({ where: { id } });
    if (!row) return null;
    return mapKnowledge(row);
  },

  listByNpcId: async (npcId) => {
    const rows = await db.npcKnowledge.findMany({ where: { npcId }, orderBy: { title: 'asc' } });
    return rows.map(mapKnowledge);
  },

  update: async (id, input: IUpdateNpcKnowledge) => {
    const row = await db.npcKnowledge.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.content !== undefined ? { content: input.content.trim() } : {}),
        ...(input.reveal !== undefined ? { reveal: input.reveal } : {}),
        ...(input.skillHint !== undefined ? { skillHint: input.skillHint } : {}),
        ...(input.dc !== undefined ? { dc: input.dc } : {}),
        ...(input.questId !== undefined ? { questId: input.questId } : {}),
      },
    });
    return mapKnowledge(row);
  },

  delete: async (id) => {
    await db.npcKnowledge.delete({ where: { id } });
  },
};
