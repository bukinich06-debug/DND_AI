import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ICreateCampaign } from '@/domain/campaign';
import { createCampaign } from '@/services/campaign/crud/createCampaign';
import { listCampaigns } from '@/services/campaign/crud/listCampaigns';

export const GET = async () => {
  try {
    return ok(await listCampaigns());
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateCampaign>(req);
    return ok(await createCampaign(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
