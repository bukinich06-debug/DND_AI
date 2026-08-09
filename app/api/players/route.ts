import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreatePlayer } from '@/domain/player';
import { createPlayer } from '@/services/player/crud/createPlayer';
import { listPlayersByCampaign } from '@/services/player/crud/listPlayersByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listPlayersByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreatePlayer>(req);
    return ok(await createPlayer(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
