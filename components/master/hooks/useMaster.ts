'use client';

import { useState } from 'react';
import type { IChatMessage, IToolCallLog } from '../types';

interface IUseMasterParams {
  campaignId: string;
  playerId: string;
}

export const useMaster = ({ campaignId, playerId }: IUseMasterParams) => {
  const sessionKey = `${campaignId}:${playerId}`;
  const [activeKey, setActiveKey] = useState(sessionKey);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [toolLogs, setToolLogs] = useState<IToolCallLog[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeKey !== sessionKey) {
    setActiveKey(sessionKey);
    setMessages([]);
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
      const res = await fetch('/api/test/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          playerId,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось получить ответ мастера.');

      const calls = Array.isArray(data.toolCalls) ? (data.toolCalls as IToolCallLog[]) : [];
      if (calls.length > 0) setToolLogs((prev) => [...prev, ...calls]);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.say as string,
          verdict: typeof data.verdict === 'string' ? data.verdict : undefined,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки.');
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    toolLogs,
    input,
    setInput,
    sending,
    error,
    send,
  };
};
