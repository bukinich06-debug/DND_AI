'use client';

import { useState } from 'react';
import type { HookRunStatus, IChatMessage, IHookRunLog, IToolCallLog } from '../types';

interface IUseNpcChatParams {
  campaignId: string;
  playerId: string;
  npcId: string;
}

const POLL_MS = 1000;
const POLL_MAX_MS = 90_000;

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

export const useNpcChat = ({ campaignId, playerId, npcId }: IUseNpcChatParams) => {
  const sessionKey = `${campaignId}:${playerId}:${npcId}`;
  const [activeKey, setActiveKey] = useState(sessionKey);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [toolLogs, setToolLogs] = useState<IToolCallLog[]>([]);
  const [hookLogs, setHookLogs] = useState<IHookRunLog[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeKey !== sessionKey) {
    setActiveKey(sessionKey);
    setMessages([]);
    setToolLogs([]);
    setHookLogs([]);
    setInput('');
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

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!campaignId || !playerId || !npcId) {
      setError('Выберите кампанию, игрока и NPC.');
      return;
    }

    const nextMessages: IChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/test/npc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          playerId,
          npcId,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось получить ответ NPC.');

      const calls = Array.isArray(data.toolCalls) ? (data.toolCalls as IToolCallLog[]) : [];
      if (calls.length > 0) setToolLogs((prev) => [...prev, ...calls]);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.say as string,
          do: (data.do as string | null) ?? null,
        },
      ]);

      const turnId = typeof data.turnId === 'string' ? data.turnId.trim() : '';
      if (turnId) {
        mergeHookTurn([
          {
            turnId,
            name: 'resolveMentionedLocations',
            status: 'running',
            toolCalls: [],
          },
          {
            turnId,
            name: 'resolveMentionedNpcs',
            status: 'running',
            toolCalls: [],
          },
        ]);
        setSending(false);
        try {
          await pollHooks(turnId, mergeHookTurn);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Ошибка опроса hooks.');
        }
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки.');
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    toolLogs,
    hookLogs,
    input,
    setInput,
    sending,
    error,
    send,
  };
};
