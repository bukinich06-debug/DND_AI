import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ICreateItem } from '@/domain/item';
import { createItem } from '@/services/item/crud/createItem';
import { listItemsByCampaign } from '@/services/item/crud/listItemsByCampaign';
import { listItemsByLocation } from '@/services/item/crud/listItemsByLocation';
import { listItemsByPlayer } from '@/services/item/crud/listItemsByPlayer';

const listItems = async (url: string) => {
  const params = new URL(url).searchParams;
  const campaignId = params.get('campaignId');
  const playerId = params.get('playerId');
  const locationId = params.get('locationId');
  const keys = [campaignId, playerId, locationId].filter(Boolean);
  if (keys.length > 1) throw new Error('Укажите только campaignId, playerId или locationId.');
  if (playerId) return listItemsByPlayer(playerId);
  if (campaignId) return listItemsByCampaign(campaignId);
  if (locationId) return listItemsByLocation(locationId);
  throw new Error('Укажите campaignId, playerId или locationId.');
};

export const GET = async (req: Request) => {
  try {
    return ok(await listItems(req.url));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateItem>(req);
    return ok(await createItem(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
