'use client';

import { useState } from 'react';
import type { HookRunStatus, IHookRunLog, ILookEntry, IToolCallLog } from '../types';

interface IUseLocationLookParams {
  campaignId: string;
  playerId: string;
  locationId: string;
}

const POLL_MS = 1000;
const POLL_MAX_MS = 90_000;
const WORLD_HOOKS = ['resolveWorldLocations', 'resolveWorldNpcs'] as const;

const isTerminal = (status: HookRunStatus) => status === 'done' || status === 'failed';

const pollHooks = async (turnId: string, onUpdate: (hooks: IHookRunLog[]) => void) => {
  const started = Date.now();
  while (Date.now() - started < POLL_MAX_MS) {
    const res = await fetch(`/api/test/npc-chat/hooks?turnId=${encodeURIComponent(turnId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Не удалось получить статус hooks.');

    const hooks = Array.isArray(data.hooks) ? (data.hooks as IHookRunLog[]) : [];
    onUpdate(hooks);
    if (hooks.length > 0 && hooks.every((h) => isTerminal(h.status))) return;

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

export const useLocationLook = ({ campaignId, playerId, locationId }: IUseLocationLookParams) => {
  const sessionKey = `${campaignId}:${playerId}:${locationId}`;
  const [activeKey, setActiveKey] = useState(sessionKey);
  const [looks, setLooks] = useState<ILookEntry[]>([]);
  const [hookLogs, setHookLogs] = useState<IHookRunLog[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeKey !== sessionKey) {
    setActiveKey(sessionKey);
    setLooks([]);
    setHookLogs([]);
    setSending(false);
    setError(null);
  }

  const mergeHookTurn = (hooks: IHookRunLog[]) => {
    if (hooks.length === 0) return;
    const turnId = hooks[0].turnId;
    setHookLogs((prev) => {
      const without = prev.filter((h) => h.turnId !== turnId);
      return [...without, ...hooks];
    });
  };

  const request = async () => {
    if (sending) return;
    if (!campaignId || !playerId || !locationId) {
      setError('Выберите кампанию, игрока и локацию.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/test/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, playerId, locationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось получить описание.');

      const look = typeof data.look === 'string' ? data.look.trim() : '';
      if (!look) throw new Error('Пустое описание.');

      setLooks((prev) => [...prev, { look }]);

      const turnId = typeof data.turnId === 'string' ? data.turnId.trim() : '';
      if (turnId) {
        mergeHookTurn(
          WORLD_HOOKS.map((name) => ({
            turnId,
            name,
            status: 'running' as const,
            toolCalls: [],
          }))
        );
        setSending(false);
        try {
          await pollHooks(turnId, mergeHookTurn);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Ошибка опроса hooks.');
        }
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запроса.');
    } finally {
      setSending(false);
    }
  };

  const toolLogs: IToolCallLog[] = hookLogs.flatMap((hook) => hook.toolCalls);

  return {
    looks,
    toolLogs,
    hookLogs,
    sending,
    error,
    request,
  };
};
