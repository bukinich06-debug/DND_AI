'use server';

import { npcRelationRepository } from '@/data/npc';

export const listNpcRelations = async (npcId: string) => npcRelationRepository.listByNpcId(npcId);
