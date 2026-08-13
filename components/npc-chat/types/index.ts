export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  do?: string | null;
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

export type HookRunStatus = 'running' | 'done' | 'failed';

export interface IHookRunLog {
  turnId: string;
  name: string;
  status: HookRunStatus;
  toolCalls: IToolCallLog[];
  error?: string;
}
