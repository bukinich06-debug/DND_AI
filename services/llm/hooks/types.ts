import type { INpcReply } from '@/services/llm/npc/parseNpcReply';

export interface IHookToolCall {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export type HookRunStatus = 'running' | 'done' | 'failed';

export type HookSource = 'npc' | 'world';

export interface IHookRunLog {
  turnId: string;
  name: string;
  status: HookRunStatus;
  toolCalls: IHookToolCall[];
  error?: string;
}

export interface IHookContext {
  campaignId: string;
  playerId: string;
  reply: INpcReply;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  playerName: string;
  turnId: string;
  source: HookSource;
  npcId?: string;
  speakerName?: string;
  locationId?: string;
}

export interface IAgentHook {
  name: string;
  run: (ctx: IHookContext) => Promise<IHookToolCall[]>;
}

export const chatHookKey = (campaignId: string, npcId: string, playerId: string) =>
  `${campaignId}:${npcId}:${playerId}`;

export const worldHookKey = (campaignId: string, playerId: string, locationId: string) =>
  `${campaignId}:world:${playerId}:${locationId}`;
