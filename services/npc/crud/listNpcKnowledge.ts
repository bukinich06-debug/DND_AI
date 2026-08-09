'use server';

import { npcKnowledgeRepository } from '@/data/npc';

export const listNpcKnowledge = async (npcId: string) => npcKnowledgeRepository.listByNpcId(npcId);
