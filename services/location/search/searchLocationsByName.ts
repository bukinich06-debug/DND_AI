'use server';

import { locationRepository } from '@/data/location';
import { findInChain, walkAncestors, type ILocation } from '@/domain/location';
import { LocationKind } from '@/domain/shared';

interface ISearchLocationsByNameInput {
  campaignId: string;
  name: string;
  nearLocationId?: string;
}

const rankNear = (loc: ILocation, nearId: string, byId: Map<string, ILocation>): number => {
  const nearChain = walkAncestors(nearId, byId);
  const nearSettlement = findInChain(nearChain, [LocationKind.settlement]);
  const nearRegion = findInChain(nearChain, [LocationKind.region]);

  if (nearSettlement && loc.parentId === nearSettlement.id) return 0;
  if (nearSettlement && loc.id === nearSettlement.id) return 1;
  if (nearSettlement && loc.kind === LocationKind.settlement && loc.parentId === nearSettlement.parentId) return 2;

  const chain = walkAncestors(loc.id, byId);
  if (nearRegion && chain.some((c) => c.id === nearRegion.id)) return 3;
  return 4;
};

export const searchLocationsByName = async ({
  campaignId,
  name,
  nearLocationId,
}: ISearchLocationsByNameInput): Promise<ILocation[]> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!name.trim()) throw new Error('Название для поиска обязательно.');

  const found = await locationRepository.searchByName({ campaignId, name });
  if (found.length <= 1 || !nearLocationId?.trim()) return found;

  const all = await locationRepository.listByCampaignId(campaignId);
  const byId = new Map(all.map((loc) => [loc.id, loc]));
  if (!byId.has(nearLocationId.trim())) return found;

  return [...found].sort((a, b) => {
    const diff = rankNear(a, nearLocationId.trim(), byId) - rankNear(b, nearLocationId.trim(), byId);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, 'ru');
  });
};
