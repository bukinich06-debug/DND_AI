'use client';

import { useState } from 'react';
import type { IChatMessage, IPlanStep, IToolCallLog } from '../types';

interface IUsePlanParams {
  campaignId: string;
  playerId: string;
}

export const usePlan = ({ campaignId, playerId }: IUsePlanParams) => {
  const sessionKey = `${campaignId}:${playerId}`;
  const [activeKey, setActiveKey] = useState(sessionKey);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [steps, setSteps] = useState<IPlanStep[] | null>(null);
  const [toolLogs, setToolLogs] = useState<IToolCallLog[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeKey !== sessionKey) {
    setActiveKey(sessionKey);
    setMessages([]);
    setSteps(null);
    setToolLogs([]);
    setInput('');
    setSending(false);
    setError(null);
  }

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!campaignId || !playerId) {
      setError('Выберите кампанию и игрока.');
      return;
    }

    const nextMessages: IChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          playerId,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось получить план.');

      const calls = Array.isArray(data.toolCalls) ? (data.toolCalls as IToolCallLog[]) : [];
      if (calls.length > 0) setToolLogs((prev) => [...prev, ...calls]);

      const nextSteps = Array.isArray(data.steps) ? (data.steps as IPlanStep[]) : [];
      setSteps(nextSteps);
      setMessages((prev) => [...prev, { role: 'assistant', content: JSON.stringify(nextSteps, null, 2) }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки.');
      setSteps(null);
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    steps,
    toolLogs,
    input,
    setInput,
    sending,
    error,
    send,
  };
};
