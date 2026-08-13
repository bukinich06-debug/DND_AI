import type { HookRunStatus, IHookRunLog, IHookToolCall } from '../types';

interface ITurnEntry {
  chatKey: string;
  hooks: IHookRunLog[];
}

const turns = new Map<string, ITurnEntry>();

export const createTurn = (chatKey: string, hookNames: string[]) => {
  const turnId = crypto.randomUUID();
  const hooks: IHookRunLog[] = hookNames.map((name) => ({
    turnId,
    name,
    status: 'running',
    toolCalls: [],
  }));
  turns.set(turnId, { chatKey, hooks });
  return turnId;
};

export const appendToolCall = (turnId: string, hookName: string, call: IHookToolCall) => {
  const entry = turns.get(turnId);
  if (!entry) return;
  const hook = entry.hooks.find((h) => h.name === hookName);
  if (!hook) return;
  hook.toolCalls.push(call);
};

export const setHookToolCalls = (turnId: string, hookName: string, calls: IHookToolCall[]) => {
  const entry = turns.get(turnId);
  if (!entry) return;
  const hook = entry.hooks.find((h) => h.name === hookName);
  if (!hook) return;
  hook.toolCalls = calls;
};

export const finishHook = (turnId: string, hookName: string, status: HookRunStatus, error?: string) => {
  const entry = turns.get(turnId);
  if (!entry) return;
  const hook = entry.hooks.find((h) => h.name === hookName);
  if (!hook) return;
  hook.status = status;
  if (error) hook.error = error;
  else delete hook.error;
};

export const getTurn = (turnId: string): IHookRunLog[] | null => {
  const entry = turns.get(turnId);
  if (!entry) return null;
  return entry.hooks.map((h) => ({
    ...h,
    toolCalls: [...h.toolCalls],
  }));
};
