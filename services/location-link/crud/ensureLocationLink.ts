'use server';

import { locationLinkRepository } from '@/data/location-link';
import { locationRepository } from '@/data/location';
import { LocationKind } from '@/domain/shared';
import { createLocationLink } from './createLocationLink';

interface IEnsureLocationLinkInput {
  campaignId: string;
  fromId: string;
  toId: string;
  days?: number;
  label?: string | null;
}

export const ensureLocationLink = async (input: IEnsureLocationLinkInput) => {
  const fromId = input.fromId.trim();
  const toId = input.toId.trim();
  if (!fromId) throw new Error('Начальная локация обязательна.');
  if (!toId) throw new Error('Конечная локация обязательна.');
  if (fromId === toId) throw new Error('Начало и конец пути не могут совпадать.');

  const from = await locationRepository.getById(fromId);
  if (!from) throw new Error('Начальная локация не найдена.');
  if (from.campaignId !== input.campaignId) throw new Error('Начальная локация из другой кампании.');
  if (from.kind !== LocationKind.settlement) throw new Error('Дорогу можно проложить только между поселениями.');

  const to = await locationRepository.getById(toId);
  if (!to) throw new Error('Конечная локация не найдена.');
  if (to.campaignId !== input.campaignId) throw new Error('Конечная локация из другой кампании.');
  if (to.kind !== LocationKind.settlement) throw new Error('Дорогу можно проложить только между поселениями.');

  const links = await locationLinkRepository.listByCampaignId(input.campaignId);
  const existing = links.find(
    (link) => (link.fromId === fromId && link.toId === toId) || (link.fromId === toId && link.toId === fromId)
  );
  if (existing) return existing;

  return createLocationLink({
    campaignId: input.campaignId,
    fromId,
    toId,
    days: input.days ?? 1,
    ...(input.label !== undefined ? { label: input.label } : {}),
  });
};
