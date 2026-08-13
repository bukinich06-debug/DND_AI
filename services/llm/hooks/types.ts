import type { INpcReply } from '@/services/llm/npc/parseNpcReply';

export interface IHookToolCall {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export type HookRunStatus = 'running' | 'done' | 'failed';

export interface IHookRunLog {
  turnId: string;
  name: string;
  status: HookRunStatus;
  toolCalls: IHookToolCall[];
  error?: string;
}

export interface IHookContext {
  campaignId: string;
  npcId: string;
  playerId: string;
  reply: INpcReply;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  speakerName: string;
  playerName: string;
  turnId: string;
}

export interface IAgentHook {
  name: string;
  run: (ctx: IHookContext) => Promise<IHookToolCall[]>;
}

export const chatHookKey = (campaignId: string, npcId: string, playerId: string) =>
  `${campaignId}:${npcId}:${playerId}`;
