'use client';

import { useState } from 'react';
import type { IChatMessage, IPendingCheck, ITurnReply, ITurnResume } from '../types';

interface IUseTurnParams {
  campaignId: string;
  playerId: string;
}

const replyText = (reply: ITurnReply) => {
  if (reply.agent === 'location') return `${reply.name}\n${reply.description}`;
  if (reply.agent === 'npc') {
    if (!reply.say.trim() && !reply.do) return '';
    const action = reply.do ? `\n(${reply.do})` : '';
    return `${reply.npcName}: ${reply.say}${action}`;
  }
  return `[${reply.verdict}] ${reply.say}`;
};

export const useTurn = ({ campaignId, playerId }: IUseTurnParams) => {
  const sessionKey = `${campaignId}:${playerId}`;
  const [activeKey, setActiveKey] = useState(sessionKey);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [replies, setReplies] = useState<ITurnReply[]>([]);
  const [pending, setPending] = useState<{ check: IPendingCheck; resume: ITurnResume } | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeKey !== sessionKey) {
    setActiveKey(sessionKey);
    setMessages([]);
    setReplies([]);
    setPending(null);
    setInput('');
    setSending(false);
    setError(null);
  }

  const applyTurn = (data: {
    status?: string;
    replies?: ITurnReply[];
    check?: IPendingCheck;
    resume?: ITurnResume;
  }) => {
    const nextReplies = Array.isArray(data.replies) ? data.replies : [];
    const shown =
      data.status === 'need_check'
        ? nextReplies.filter((r) => r.agent !== 'npc' || Boolean(r.say.trim() || r.do))
        : nextReplies;
    setReplies((prev) => [...prev, ...shown]);
    const texts = shown.map(replyText).filter(Boolean);
    if (texts.length > 0) setMessages((prev) => [...prev, { role: 'assistant', content: texts.join('\n\n') }]);

    if (data.status === 'need_check' && data.check && data.resume) {
      setPending({ check: data.check, resume: data.resume });
      return;
    }
    setPending(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || pending) return;
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
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          playerId,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось выполнить ход.');
      applyTurn(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки.');
    } finally {
      setSending(false);
    }
  };

  const roll = async () => {
    if (!pending || sending) return;
    if (!campaignId || !playerId) {
      setError('Выберите кампанию и игрока.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const rollRes = await fetch('/api/dice-rolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          playerId,
          die: pending.check.die || 'd20',
          note: pending.check.skill,
        }),
      });
      const rollData = await rollRes.json();
      if (!rollRes.ok) throw new Error(rollData.error || 'Не удалось бросить кубик.');
      const rollId = typeof rollData.id === 'string' ? rollData.id : '';
      if (!rollId) throw new Error('Сервер не вернул id броска.');

      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          playerId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          resume: pending.resume,
          check: pending.check,
          rollId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось продолжить ход.');
      applyTurn(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка броска.');
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    replies,
    pending,
    input,
    setInput,
    sending,
    error,
    send,
    roll,
  };
};
