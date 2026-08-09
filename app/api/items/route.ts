import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreateItem } from '@/domain/item';
import { createItem } from '@/services/item/crud/createItem';
import { listItemsByCampaign } from '@/services/item/crud/listItemsByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listItemsByCampaign(campaignId));
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
