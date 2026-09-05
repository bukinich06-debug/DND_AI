'use server';

import { adjudicatePlayerAction } from '@/services/llm/master/adjudicatePlayerAction';
import type { MasterVerdict } from '@/services/llm/master/parseMasterReply';
import type { IToolCallLog } from '@/services/llm/master/runMasterToolLoop';
import { chatWithNpc } from '@/services/llm/npc/chatWithNpc';
import type { IPlanStep } from '@/services/llm/plan/parsePlanReply';
import { planPlayerInput } from '@/services/llm/plan/planPlayerInput';
import { describeLocation } from '@/services/llm/world/describeLocation';
import { getLocation } from '@/services/location/crud/getLocation';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IRunPlayerTurnParams {
  campaignId: string;
  playerId: string;
  messages: IChatMessage[];
}

type ITurnReply =
  | {
      agent: 'location';
      locationId: string;
      name: string;
      isSecret: boolean;
      description: string;
      summary: string;
      features: string;
    }
  | { agent: 'npc'; npcId: string; npcName: string; say: string; do: string | null }
  | { agent: 'master'; verdict: MasterVerdict; say: string; toolCalls: IToolCallLog[] };

const lastUserMessage = (messages: IChatMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  throw new Error('Нужна хотя бы одна реплика игрока.');
};

const runStep = async (
  campaignId: string,
  playerId: string,
  messages: IChatMessage[],
  step: IPlanStep
): Promise<ITurnReply> => {
  if (step.agent === 'world') {
    const result = await describeLocation({
      campaignId,
      playerId,
      locationId: step.locationId,
      message: lastUserMessage(messages),
    });
    const loc = await getLocation(result.locationId);

    return {
      agent: 'location',
      locationId: loc.id,
      name: loc.name,
      isSecret: loc.isSecret,
      description: loc.description,
      summary: loc.summary,
      features: loc.features,
    };
  }

  if (step.agent === 'npc') {
    const result = await chatWithNpc({ campaignId, playerId, npcId: step.npcId, messages });
    return {
      agent: 'npc',
      npcId: step.npcId,
      npcName: step.npcName,
      say: result.say,
      do: result.do,
    };
  }

  const result = await adjudicatePlayerAction({ campaignId, playerId, messages });
  return { agent: 'master', verdict: result.verdict, say: result.say, toolCalls: result.toolCalls };
};

export const runPlayerTurn = async (input: IRunPlayerTurnParams): Promise<ITurnReply[]> => {
  const { steps } = await planPlayerInput(input);
  const replies: ITurnReply[] = [];

  for (const step of steps) replies.push(await runStep(input.campaignId, input.playerId, input.messages, step));

  return replies;
};
