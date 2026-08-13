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

interface INpcRow {
  id: string;
  name: string;
  title: string | null;
}

export const useNpcChatSelects = () => {
  const [campaigns, setCampaigns] = useState<IOption[]>([]);
  const [players, setPlayers] = useState<IOption[]>([]);
  const [npcs, setNpcs] = useState<IOption[]>([]);
  const [campaignId, setCampaignIdState] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [npcId, setNpcId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const setCampaignId = (id: string) => {
    setCampaignIdState(id);
    setPlayers([]);
    setNpcs([]);
    setPlayerId('');
    setNpcId('');
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
        const [playersRes, npcsRes] = await Promise.all([
          fetch(`/api/players?campaignId=${encodeURIComponent(campaignId)}`),
          fetch(`/api/npcs?campaignId=${encodeURIComponent(campaignId)}`),
        ]);
        const playersData = await playersRes.json();
        const npcsData = await npcsRes.json();
        if (!playersRes.ok) throw new Error(playersData.error || 'Не удалось загрузить игроков.');
        if (!npcsRes.ok) throw new Error(npcsData.error || 'Не удалось загрузить NPC.');
        if (cancelled) return;
        setPlayers((playersData as IPlayerRow[]).map((p) => ({ id: p.id, label: p.name })));
        setNpcs(
          (npcsData as INpcRow[]).map((n) => ({
            id: n.id,
            label: n.title ? `${n.name} (${n.title})` : n.name,
          }))
        );
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
    npcs,
    campaignId,
    playerId,
    npcId,
    setCampaignId,
    setPlayerId,
    setNpcId,
    loadError,
  };
};
