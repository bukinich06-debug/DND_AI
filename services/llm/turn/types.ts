import type { ICheckOutcome } from '@/services/llm/check/formatCheckOutcome';
import type { MasterVerdict } from '@/services/llm/master/parseMasterReply';
import type { IToolCallLog } from '@/services/llm/master/runMasterToolLoop';
import type { IPlanStep } from '@/services/llm/plan/parsePlanReply';
import type { IResolvedCheck } from './resolveRequestedCheck';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ITurnReply =
  | {
      agent: 'location';
      locationId: string;
      name: string;
      isSecret: boolean;
      description: string;
      summary: string;
      features: string;
    }
  | {
      agent: 'npc';
      npcId: string;
      npcName: string;
      say: string;
      do: string | null;
      openShop?: { specialtyKey: string };
    }
  | {
      agent: 'master';
      verdict: MasterVerdict;
      say: string;
      toolCalls: IToolCallLog[];
      ui?: { openShop?: { npcId: string; npcName: string } };
    };

export type ITurnResume =
  { agent: 'npc'; npcId: string; remainingSteps: IPlanStep[] } | { agent: 'master'; remainingSteps: IPlanStep[] };

export interface INeedCheckTurn {
  status: 'need_check';
  replies: ITurnReply[];
  check: IResolvedCheck;
  resume: ITurnResume;
  ui?: { openShop?: { npcId: string; npcName: string; specialtyKey: string } };
}

export interface IDoneTurn {
  status: 'done';
  replies: ITurnReply[];
  ui?: { openShop?: { npcId: string; npcName: string; specialtyKey: string } };
}

export type ITurnResult = INeedCheckTurn | IDoneTurn;

export interface IRunPlayerTurnParams {
  campaignId: string;
  playerId: string;
  messages: IChatMessage[];
  resume?: ITurnResume;
  check?: { skill: string; dc: number; knowledgeId?: string | null };
  rollId?: string;
}

export type { ICheckOutcome };
