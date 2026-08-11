'use server';

import { npcMemoryRepository } from '@/data/npc';
import type { IListNpcMemoriesFilter } from '@/domain/npc';

export const listNpcMemories = async (npcId: string, filter?: IListNpcMemoriesFilter) =>
  npcMemoryRepository.listByNpcId(npcId, filter);
