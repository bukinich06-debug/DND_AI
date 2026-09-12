import { npcRepository } from '@/data/npc';
import type { RelationStance } from '@/domain/npc';
import { KnowledgeReveal, type TimeOfDay } from '@/domain/shared';
import { getCampaign } from '@/services/campaign/crud/getCampaign';
import { listNpcAcquaintancesDetailed } from '@/services/npc/acquaintance/listNpcAcquaintancesDetailed';
import { getNpc } from '@/services/npc/crud/getNpc';
import { listNpcKnowledgeForAgent } from '@/services/npc/knowledge/listNpcKnowledgeForAgent';
import { listNpcMemories } from '@/services/npc/memory/listNpcMemories';
import { listNpcMemoriesByAboutNpc } from '@/services/npc/memory/listNpcMemoriesByAboutNpc';
import { getNpcRelationOrDefault } from '@/services/npc/relation/getNpcRelationOrDefault';
import { getPlayer } from '@/services/player/crud/getPlayer';

const MEMORY_LIMIT = 10;

interface ILoadNpcChatContextParams {
  campaignId: string;
  npcId: string;
  playerId: string;
  passedCheck?: { skill: string; knowledgeId: string | null; passed: boolean };
  arrivalTitle?: string;
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
  aboutMeMemories: Array<{
    summary: string;
    kind: string;
    importance: number;
    fromName: string;
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
  checkKnowledge: Array<{
    id: string;
    title: string;
    dc: number | null;
    skillHint: string | null;
    content: string | null;
  }>;
  clock: {
    dayIndex: number;
    timeOfDay: TimeOfDay;
  };
  arrivalTitle: string | null;
}

export const loadNpcChatContext = async ({
  campaignId,
  npcId,
  playerId,
  passedCheck,
  arrivalTitle,
}: ILoadNpcChatContextParams): Promise<INpcChatContext> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!npcId.trim()) throw new Error('npcId обязателен.');
  if (!playerId.trim()) throw new Error('playerId обязателен.');

  const npc = await getNpc(npcId);
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  const [player, campaign] = await Promise.all([getPlayer(playerId), getCampaign(campaignId)]);
  if (player.campaignId !== campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  const relation = await getNpcRelationOrDefault(npcId, playerId, campaignId);

  const allMemories = await listNpcMemories(npcId);
  const filtered = allMemories.filter((m) => m.playerId === playerId || m.playerId === null).slice(0, MEMORY_LIMIT);

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

  const aboutMeRaw = (await listNpcMemoriesByAboutNpc(npcId)).slice(0, MEMORY_LIMIT);
  const fromIds = [...new Set(aboutMeRaw.map((m) => m.npcId))];
  const fromById = new Map<string, string>();
  for (const id of fromIds) {
    const from = await npcRepository.getById(id);
    if (from) fromById.set(id, from.name);
  }
  const aboutMeMemories = aboutMeRaw.map((m) => ({
    summary: m.summary,
    kind: m.kind,
    importance: m.importance,
    fromName: fromById.get(m.npcId) ?? 'неизвестный',
  }));

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

  const checkRows = await listNpcKnowledgeForAgent(npcId, {
    reveal: KnowledgeReveal.check,
    campaignId,
    passedCheck,
  });
  const checkKnowledge = checkRows.map((k) => ({
    id: k.id,
    title: k.title,
    dc: k.dc,
    skillHint: k.skillHint,
    content: typeof k.content === 'string' && k.content.trim() ? k.content : null,
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
    aboutMeMemories,
    acquaintances,
    knowledge,
    checkKnowledge,
    clock: {
      dayIndex: campaign.dayIndex,
      timeOfDay: campaign.timeOfDay,
    },
    arrivalTitle: arrivalTitle?.trim() || null,
  };
};
