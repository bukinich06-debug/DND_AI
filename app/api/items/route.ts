import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ICreateItem } from '@/domain/item';
import { createItem } from '@/services/item/crud/createItem';
import { listItemsByCampaign } from '@/services/item/crud/listItemsByCampaign';
import { listItemsByPlayer } from '@/services/item/crud/listItemsByPlayer';

const listItems = async (url: string) => {
  const params = new URL(url).searchParams;
  const campaignId = params.get('campaignId');
  const playerId = params.get('playerId');
  if (campaignId && playerId) throw new Error('Укажите только campaignId или только playerId.');
  if (playerId) return listItemsByPlayer(playerId);
  if (campaignId) return listItemsByCampaign(campaignId);
  throw new Error('Укажите campaignId или playerId.');
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
