import type { NpcMemory } from '@/generated/client';
import type {
  ICreateNpcMemory,
  IListNpcMemoriesFilter,
  INpcMemory,
  INpcMemoryRepository,
  IUpdateNpcMemory,
} from '@/domain/npc';
import type { MemoryKind } from '@/domain/shared';
import { db } from '@/data/shared';

const mapMemory = (row: NpcMemory): INpcMemory => ({
  id: row.id,
  npcId: row.npcId,
  playerId: row.playerId,
  aboutNpcId: row.aboutNpcId,
  summary: row.summary,
  kind: row.kind as MemoryKind,
  importance: row.importance,
});

export const npcMemoryRepository: INpcMemoryRepository = {
  create: async (input: ICreateNpcMemory) => {
    const row = await db.npcMemory.create({
      data: {
        npcId: input.npcId,
        playerId: input.playerId ?? null,
        aboutNpcId: input.aboutNpcId ?? null,
        summary: input.summary.trim(),
        kind: input.kind,
        importance: input.importance ?? 3,
      },
    });
    return mapMemory(row);
  },

  getById: async (id) => {
    const row = await db.npcMemory.findUnique({ where: { id } });
    if (!row) return null;
    return mapMemory(row);
  },

  listByNpcId: async (npcId, filter?: IListNpcMemoriesFilter) => {
    const rows = await db.npcMemory.findMany({
      where: {
        npcId,
        ...(filter?.playerId !== undefined ? { playerId: filter.playerId } : {}),
        ...(filter?.minImportance !== undefined ? { importance: { gte: filter.minImportance } } : {}),
      },
      orderBy: [{ importance: 'desc' }, { id: 'asc' }],
    });
    return rows.map(mapMemory);
  },

  update: async (id, input: IUpdateNpcMemory) => {
    const row = await db.npcMemory.update({
      where: { id },
      data: {
        ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        ...(input.importance !== undefined ? { importance: input.importance } : {}),
        ...(input.playerId !== undefined ? { playerId: input.playerId } : {}),
        ...(input.aboutNpcId !== undefined ? { aboutNpcId: input.aboutNpcId } : {}),
      },
    });
    return mapMemory(row);
  },

  delete: async (id) => {
    await db.npcMemory.delete({ where: { id } });
  },
};
