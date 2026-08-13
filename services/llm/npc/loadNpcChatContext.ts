import { KnowledgeReveal } from '@/domain/shared';
import type { RelationStance } from '@/domain/npc';
import { npcRepository } from '@/data/npc';
import { listNpcAcquaintancesDetailed } from '@/services/npc/acquaintance/listNpcAcquaintancesDetailed';
import { getNpc } from '@/services/npc/crud/getNpc';
import { listNpcKnowledgeForAgent } from '@/services/npc/knowledge/listNpcKnowledgeForAgent';
import { listNpcMemories } from '@/services/npc/memory/listNpcMemories';
import { getNpcRelationOrDefault } from '@/services/npc/relation/getNpcRelationOrDefault';
import { getPlayer } from '@/services/player/crud/getPlayer';

const MEMORY_LIMIT = 10;

interface ILoadNpcChatContextParams {
  campaignId: string;
  npcId: string;
  playerId: string;
}

export interface INpcChatContext {
  npc: {
    id: string;
    name: string;
    title: string | null;
    appearance: string;
    personality: string;
    speech: string;
    habits: string;
    attitude: string | null;
  };
  player: {
    id: string;
    name: string;
  };
  relation: {
    score: number;
    stance: RelationStance;
    note: string | null;
  };
  memories: Array<{
    summary: string;
    kind: string;
    importance: number;
    aboutName: string | null;
    aboutTitle: string | null;
  }>;
  acquaintances: Array<{
    otherNpcId: string;
    name: string;
    title: string | null;
    note: string | null;
  }>;
  knowledge: Array<{
    title: string;
    content: string;
  }>;
}

export const loadNpcChatContext = async ({
  campaignId,
  npcId,
  playerId,
}: ILoadNpcChatContextParams): Promise<INpcChatContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!npcId.trim()) throw new Error('npcId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const npc = await getNpc(npcId);
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  const player = await getPlayer(playerId);
  if (player.campaignId !== campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const relation = await getNpcRelationOrDefault(npcId, playerId, campaignId);

  const allMemories = await listNpcMemories(npcId);
  const filtered = allMemories
    .filter((m) => m.playerId === playerId || m.playerId === null)
    .slice(0, MEMORY_LIMIT);

  const aboutIds = [...new Set(filtered.map((m) => m.aboutNpcId).filter(Boolean))] as string[];
  const aboutById = new Map<string, { name: string; title: string | null }>();
  for (const id of aboutIds) {
    const about = await npcRepository.getById(id);
    if (about) aboutById.set(id, { name: about.name, title: about.title });
  }

  const memories = filtered.map((m) => {
    const about = m.aboutNpcId ? aboutById.get(m.aboutNpcId) : undefined;
    return {
      summary: m.summary,
      kind: m.kind,
      importance: m.importance,
      aboutName: about?.name ?? null,
      aboutTitle: about?.title ?? null,
    };
  });

  const acquaintances = await listNpcAcquaintancesDetailed(npcId);

  const openKnowledge = await listNpcKnowledgeForAgent(npcId, {
    reveal: KnowledgeReveal.open,
    campaignId,
  });
  const knowledge = openKnowledge
    .filter((k) => typeof k.content === 'string' && k.content.trim())
    .map((k) => ({
      title: k.title,
      content: k.content as string,
    }));

  return {
    npc: {
      id: npc.id,
      name: npc.name,
      title: npc.title,
      appearance: npc.appearance,
      personality: npc.personality,
      speech: npc.speech,
      habits: npc.habits,
      attitude: npc.attitude,
    },
    player: {
      id: player.id,
      name: player.name,
    },
    relation: {
      score: relation.score,
      stance: relation.stance,
      note: relation.note,
    },
    memories,
    acquaintances,
    knowledge,
  };
};
