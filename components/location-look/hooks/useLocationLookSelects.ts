'use client';

import { useEffect, useState } from 'react';
import { pathLabel } from '../helpers/pathLabel';
import type { IOption } from '../types';

interface ICampaignRow {
  id: string;
  name: string;
}

interface IPlayerRow {
  id: string;
  name: string;
}

interface ILocationRow {
  id: string;
  name: string;
  parentId: string | null;
}

interface IPlayerLocationReply {
  location: { id: string } | null;
}

export const useLocationLookSelects = () => {
  const [campaigns, setCampaigns] = useState<IOption[]>([]);
  const [players, setPlayers] = useState<IOption[]>([]);
  const [locations, setLocations] = useState<IOption[]>([]);
  const [campaignId, setCampaignIdState] = useState('');
  const [playerId, setPlayerIdState] = useState('');
  const [locationId, setLocationId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const setCampaignId = (id: string) => {
    setCampaignIdState(id);
    setPlayers([]);
    setLocations([]);
    setPlayerIdState('');
    setLocationId('');
  };

  const setPlayerId = (id: string) => {
    setPlayerIdState(id);
    setLocationId('');
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
        const [playersRes, locationsRes] = await Promise.all([
          fetch(`/api/players?campaignId=${encodeURIComponent(campaignId)}`),
          fetch(`/api/locations?campaignId=${encodeURIComponent(campaignId)}`),
        ]);
        const playersData = await playersRes.json();
        const locationsData = await locationsRes.json();
        if (!playersRes.ok) throw new Error(playersData.error || 'Не удалось загрузить игроков.');
        if (!locationsRes.ok) throw new Error(locationsData.error || 'Не удалось загрузить локации.');
        if (cancelled) return;

        setPlayers((playersData as IPlayerRow[]).map((p) => ({ id: p.id, label: p.name })));

        const rows = locationsData as ILocationRow[];
        const byId = new Map(rows.map((loc) => [loc.id, loc]));
        setLocations(rows.map((loc) => ({ id: loc.id, label: pathLabel(loc, byId) })));
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    if (!playerId) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/players/${encodeURIComponent(playerId)}/location`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не удалось загрузить локацию игрока.');
        if (cancelled) return;
        const currentId = (data as IPlayerLocationReply).location?.id ?? '';
        setLocationId(currentId);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  return {
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
  };
};
