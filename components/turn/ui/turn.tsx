'use client';

import { useTurn } from '../hooks/useTurn';
import { useTurnSelects } from '../hooks/useTurnSelects';

const bonusText = (bonus: number) => (bonus >= 0 ? `+${bonus}` : String(bonus));

export const Turn = () => {
  const { campaigns, players, campaignId, playerId, setCampaignId, setPlayerId, loadError } = useTurnSelects();
  const { messages, pending, input, setInput, sending, error, send, roll } = useTurn({ campaignId, playerId });

  const waitingCheck = Boolean(pending);
  const canSend = Boolean(campaignId && playerId && input.trim() && !sending && !waitingCheck);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Ход (тест)</h1>
      <p style={{ color: '#555' }}>
        Реплика уходит в /api/turn. Если агент просит проверку — появится кнопка броска. Планировщик при броске не
        вызывается.
      </p>

      <div style={{ display: 'grid', gap: 12, marginBottom: 16, maxWidth: 480 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          Кампания
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">—</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          Игрок
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} disabled={!campaignId}>
            <option value="">—</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(loadError || error) && <p style={{ color: '#b00020', whiteSpace: 'pre-wrap' }}>{loadError || error}</p>}

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          minHeight: 240,
          padding: 12,
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#fafafa',
        }}
      >
        {messages.length === 0 && <p style={{ color: '#888', margin: 0 }}>Диалог пуст.</p>}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? '#dbeafe' : '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{m.role === 'user' ? 'Игрок' : 'Ход'}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
      </div>

      {pending && (
        <div
          style={{
            border: '1px solid #f59e0b',
            background: '#fffbeb',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            Нужна проверка: {pending.check.skillLabel} {bonusText(pending.check.bonus)}, Сл {pending.check.dc}
          </div>
          <button type="button" onClick={() => void roll()} disabled={sending}>
            {sending ? '…' : `Бросить ${pending.check.die} (${pending.check.skillLabel} ${bonusText(pending.check.bonus)}, Сл ${pending.check.dc})`}
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={waitingCheck ? 'Сначала бросьте кубик…' : 'Реплика игрока…'}
          disabled={sending || waitingCheck || !campaignId || !playerId}
          style={{ flex: 1, padding: '8px 10px' }}
        />
        <button type="submit" disabled={!canSend}>
          {sending ? '…' : 'Отправить'}
        </button>
      </form>
    </main>
  );
};
