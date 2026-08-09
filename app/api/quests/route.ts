import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreateQuest } from '@/domain/quest';
import { createQuest } from '@/services/quest/crud/createQuest';
import { listQuestsByCampaign } from '@/services/quest/crud/listQuestsByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listQuestsByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateQuest>(req);
    return ok(await createQuest(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
