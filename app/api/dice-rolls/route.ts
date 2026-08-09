import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import type { IRollDice } from '@/domain/dice';
import { listDiceRollsByCampaign } from '@/services/dice/crud/listDiceRollsByCampaign';
import { rollDice } from '@/services/dice/roll/rollDice';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    return ok(await listDiceRollsByCampaign(campaignId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IRollDice>(req);
    return ok(await rollDice(body), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
