import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreateLocation } from '@/domain/location';
import { createLocation } from '@/services/location/crud/createLocation';
import { listLocationsByCampaign } from '@/services/location/crud/listLocationsByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listLocationsByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateLocation>(req);
    return ok(await createLocation(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
