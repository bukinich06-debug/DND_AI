import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreateNpc } from '@/domain/npc';
import { createNpc } from '@/services/npc/crud/createNpc';
import { listNpcsByCampaign } from '@/services/npc/crud/listNpcsByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listNpcsByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateNpc>(req);
    return ok(await createNpc(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
