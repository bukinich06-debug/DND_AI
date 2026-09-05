'use client';

import { useEffect, useState } from 'react';
import type { IOption } from '../types';

interface ICampaignRow {
  id: string;
  name: string;
}

interface IPlayerRow {
  id: string;
  name: string;
}

export const useMasterSelects = () => {
  const [campaigns, setCampaigns] = useState<IOption[]>([]);
  const [players, setPlayers] = useState<IOption[]>([]);
  const [campaignId, setCampaignIdState] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const setCampaignId = (id: string) => {
    setCampaignIdState(id);
    setPlayers([]);
    setPlayerId('');
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не удалось загрузить кампании.');
        if (cancelled) return;
        setCampaigns((data as ICampaignRow[]).map((c) => ({ id: c.id, label: c.name })));
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!campaignId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoadError(null);
        const res = await fetch(`/api/players?campaignId=${encodeURIComponent(campaignId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не удалось загрузить игроков.');
        if (cancelled) return;
        setPlayers((data as IPlayerRow[]).map((p) => ({ id: p.id, label: p.name })));
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  return {
    campaigns,
    players,
    campaignId,
    playerId,
    setCampaignId,
    setPlayerId,
    loadError,
  };
};
