'use client';

import { useLocationLook } from '../hooks/useLocationLook';
import { useLocationLookSelects } from '../hooks/useLocationLookSelects';
import type { IHookRunLog, IToolCallLog } from '../types';
import type { ReactNode } from 'react';

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const statusColor = (status: IHookRunLog['status']) => {
  if (status === 'done') return '#15803d';
  if (status === 'failed') return '#b91c1c';
  return '#a16207';
};

const ToolCard = ({ call, index }: { call: IToolCallLog; index: number }) => (
  <div
    style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 10,
      background: call.ok ? '#fff' : '#fef2f2',
      fontSize: 13,
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: 6 }}>
      #{index + 1} {call.name}{' '}
      <span style={{ color: call.ok ? '#15803d' : '#b91c1c' }}>{call.ok ? 'ok' : 'error'}</span>
    </div>
    <div style={{ color: '#6b7280', marginBottom: 4 }}>args</div>
    <pre
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 120,
        overflow: 'auto',
        background: '#f9fafb',
        padding: 8,
        borderRadius: 4,
      }}
    >
      {formatJson(call.args)}
    </pre>
    {call.ok && (
      <>
        <div style={{ color: '#6b7280', margin: '8px 0 4px' }}>result</div>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 160,
            overflow: 'auto',
            background: '#f9fafb',
            padding: 8,
            borderRadius: 4,
          }}
        >
          {formatJson(call.result)}
        </pre>
      </>
    )}
    {!call.ok && call.error && (
      <div style={{ marginTop: 8, color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{call.error}</div>
    )}
  </div>
);

const HookCard = ({ hook }: { hook: IHookRunLog }) => (
  <div
    style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 10,
      background: hook.status === 'failed' ? '#fef2f2' : '#fff',
      fontSize: 13,
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: 6 }}>
      {hook.name}{' '}
      <span style={{ color: statusColor(hook.status) }}>{hook.status}</span>
    </div>
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>turn {hook.turnId.slice(0, 8)}…</div>
    {hook.error && (
      <div style={{ marginBottom: 8, color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{hook.error}</div>
    )}
    {hook.toolCalls.length === 0 && hook.status === 'running' && (
      <p style={{ margin: 0, color: '#888' }}>Выполняется…</p>
    )}
    {hook.toolCalls.length === 0 && hook.status === 'done' && (
      <p style={{ margin: 0, color: '#888' }}>Без tool calls.</p>
    )}
    {hook.toolCalls.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hook.toolCalls.map((call, i) => (
          <ToolCard key={`${hook.turnId}-${call.name}-${i}`} call={call} index={i} />
        ))}
      </div>
    )}
  </div>
);

const LogAside = ({
  title,
  hint,
  empty,
  children,
}: {
  title: string;
  hint: string;
  empty: boolean;
  children: ReactNode;
}) => (
  <aside
    style={{
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 12,
      background: '#f8fafc',
      minHeight: 360,
      maxHeight: 560,
      overflow: 'auto',
    }}
  >
    <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h2>
    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>{hint}</p>
    {empty && <p style={{ color: '#888', margin: 0 }}>Пока пусто.</p>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
  </aside>
);

export const LocationLook = () => {
  const {
    campaigns,
    players,
    locations,
    campaignId,
    playerId,
    locationId,
    setCampaignId,
    setPlayerId,
    setLocationId,
    loadError,
  } = useLocationLookSelects();

  const { looks, toolLogs, hookLogs, sending, clearing, error, request, clearCache } = useLocationLook({
    campaignId,
    playerId,
    locationId,
  });

  const busy = sending || clearing;
  const canRequest = Boolean(campaignId && playerId && locationId && !busy);
  const canClear = Boolean(locationId && !busy);

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Location look (тест)</h1>
      <p style={{ color: '#555' }}>Выберите кампанию, игрока и локацию, затем получите описание места.</p>

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

        <label style={{ display: 'grid', gap: 4 }}>
          Локация
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!campaignId}>
            <option value="">—</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(loadError || error) && <p style={{ color: '#b00020', whiteSpace: 'pre-wrap' }}>{loadError || error}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 1fr) minmax(0, 1.4fr) minmax(240px, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <LogAside title="Hooks" hint="Post-hooks после описания (poll по turnId)." empty={hookLogs.length === 0}>
          {hookLogs.map((hook) => (
            <HookCard key={`${hook.turnId}-${hook.name}`} hook={hook} />
          ))}
        </LogAside>

        <div>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              minHeight: 360,
              padding: 12,
              marginBottom: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: '#fafafa',
            }}
          >
            {looks.length === 0 && <p style={{ color: '#888', margin: 0 }}>Пока нет описания.</p>}
            {looks.map((entry, i) => (
              <div
                key={`${entry.look.slice(0, 12)}-${i}`}
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  Мир{entry.cached ? ' · из кэша' : ''}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{entry.look}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={!canRequest} onClick={() => void request()}>
              {sending ? '…' : 'Получить описание'}
            </button>
            <button type="button" disabled={!canClear} onClick={() => void clearCache()}>
              {clearing ? '…' : 'Сбросить кэш'}
            </button>
          </div>
        </div>

        <LogAside title="Tools" hint="Вызовы post-hooks за сессию." empty={toolLogs.length === 0}>
          {toolLogs.map((call, i) => (
            <ToolCard key={`${call.name}-${i}`} call={call} index={i} />
          ))}
        </LogAside>
      </div>
    </main>
  );
};
