import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { ICreateMonsterTemplate } from '@/domain/monster-template';
import { createMonsterTemplate } from '@/services/monster-template/crud/createMonsterTemplate';
import { listMonsterTemplatesByCampaign } from '@/services/monster-template/crud/listMonsterTemplatesByCampaign';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listMonsterTemplatesByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ICreateMonsterTemplate>(req);
    return ok(await createMonsterTemplate(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
