import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import { normalizeSkillKey, skillBonus, skillLabel, type Skill } from '@/domain/player';
import { getPlayer } from '@/services/player/crud/getPlayer';

export interface IResolvedCheck {
  skill: Skill;
  skillLabel: string;
  dc: number;
  bonus: number;
  die: 'd20';
  knowledgeId: string | null;
}

interface IResolveRequestedCheckParams {
  campaignId: string;
  playerId: string;
  skill: string;
  dc: number;
  knowledgeId: string | null;
  npcId?: string;
}

export const resolveRequestedCheck = async ({
  campaignId,
  playerId,
  skill: rawSkill,
  dc: dcHint,
  knowledgeId,
  npcId,
}: IResolveRequestedCheckParams): Promise<IResolvedCheck> => {
  const player = await getPlayer(playerId);
  if (player.campaignId !== campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  let skill = normalizeSkillKey(rawSkill);
  if (!skill) throw new Error('Неизвестный навык проверки.');
  let dc = dcHint;
  let resolvedKnowledgeId: string | null = knowledgeId;

  if (knowledgeId) {
    const knowledge = await npcKnowledgeRepository.getById(knowledgeId);
    if (!knowledge) throw new Error('Знание NPC не найдено.');
    const npc = await npcRepository.getById(knowledge.npcId);
    if (!npc) throw new Error('NPC не найден.');
    if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');
    if (npcId && knowledge.npcId !== npcId) throw new Error('Знание не принадлежит этому NPC.');
    if (knowledge.dc == null) throw new Error('У знания нет DC.');
    dc = knowledge.dc;
    const fromHint = knowledge.skillHint ? normalizeSkillKey(knowledge.skillHint) : null;
    if (fromHint) skill = fromHint;
    resolvedKnowledgeId = knowledge.id;
  }

  return {
    skill,
    skillLabel: skillLabel(skill),
    dc,
    bonus: skillBonus(player, skill),
    die: 'd20',
    knowledgeId: resolvedKnowledgeId,
  };
};
