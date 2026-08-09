import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateCampaign } from '@/domain/campaign';
import { deleteCampaign } from '@/services/campaign/crud/deleteCampaign';
import { getCampaign } from '@/services/campaign/crud/getCampaign';
import { updateCampaign } from '@/services/campaign/crud/updateCampaign';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getCampaign(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateCampaign>(req);
    return ok(await updateCampaign(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteCampaign(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
