import type { KnowledgeReveal } from '@/domain/shared';

export interface INpcKnowledge {
  id: string;
  npcId: string;
  title: string;
  content: string;
  reveal: KnowledgeReveal;
  skillHint: string | null;
  dc: number | null;
  questId: string | null;
}

export type ICreateNpcKnowledge = Omit<INpcKnowledge, 'id'>;

export type IUpdateNpcKnowledge = Partial<Omit<ICreateNpcKnowledge, 'npcId'>>;

export interface INpcKnowledgeRepository {
  create: (input: ICreateNpcKnowledge) => Promise<INpcKnowledge>;
  getById: (id: string) => Promise<INpcKnowledge | null>;
  listByNpcId: (npcId: string) => Promise<INpcKnowledge[]>;
  update: (id: string, input: IUpdateNpcKnowledge) => Promise<INpcKnowledge>;
  delete: (id: string) => Promise<void>;
}
