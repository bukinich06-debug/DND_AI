export interface ILookEntry {
  look: string;
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
