export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IOption {
  id: string;
  label: string;
}

export interface IToolCallLog {
  name: string;
  args: unknown;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export type IPlanStep = { agent: 'npc'; npcId: string; npcName: string } | { agent: 'master' };
