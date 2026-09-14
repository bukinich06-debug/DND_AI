import { getNpc } from '@/services/npc/crud/getNpc';
import type { IParsedPlanStep, IPlanStep } from './parsePlanReply';

interface IFillPlanStepNamesParams {
  campaignId: string;
  steps: IParsedPlanStep[];
}

const fillOne = async (campaignId: string, step: IParsedPlanStep): Promise<IPlanStep> => {
  if (step.agent === 'npc') {
    const npc = await getNpc(step.npcId);
    if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');
    return { agent: 'npc', npcId: npc.id, npcName: npc.name };
  }
  return { agent: 'master' };
};

export const fillPlanStepNames = async ({ campaignId, steps }: IFillPlanStepNamesParams): Promise<IPlanStep[]> => {
  const filled: IPlanStep[] = [];
  for (const step of steps) filled.push(await fillOne(campaignId, step));
  return filled;
};
