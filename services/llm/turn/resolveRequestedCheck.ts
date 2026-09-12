import { npcKnowledgeRepository, npcRepository } from '@/data/npc';
import {
  normalizeSkillKey,
  normalizeToolKey,
  skillBonus,
  skillLabel,
  toolBonus,
  toolLabel,
  type Skill,
  type Tool,
} from '@/domain/player';
import { getPlayer } from '@/services/player/crud/getPlayer';

export interface IResolvedCheck {
  skill: Skill | Tool;
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

const parseCheckKey = (raw: string): Skill | Tool | null => normalizeSkillKey(raw) ?? normalizeToolKey(raw);

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

  let skill = parseCheckKey(rawSkill);
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
    const fromHint = knowledge.skillHint ? parseCheckKey(knowledge.skillHint) : null;
    if (fromHint) skill = fromHint;
    resolvedKnowledgeId = knowledge.id;
  }

  const asSkill = normalizeSkillKey(skill);
  const asTool = asSkill ? null : normalizeToolKey(skill);
  if (!asSkill && !asTool) throw new Error('Неизвестный навык проверки.');

  return {
    skill: asSkill ?? asTool!,
    skillLabel: asSkill ? skillLabel(asSkill) : toolLabel(asTool!),
    dc,
    bonus: asSkill ? skillBonus(player, asSkill) : toolBonus(player, asTool!),
    die: 'd20',
    knowledgeId: resolvedKnowledgeId,
  };
};
