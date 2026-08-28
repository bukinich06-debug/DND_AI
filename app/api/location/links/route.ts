import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreateLocationLink } from '@/domain/location-link';
import { createLocationLink } from '@/services/location-link/crud/createLocationLink';
import { listLocationLinksByCampaign } from '@/services/location-link/crud/listLocationLinksByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listLocationLinksByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateLocationLink>(req);
    return ok(await createLocationLink(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
