import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { describeLocation } from '@/services/llm/world/describeLocation';

interface IBody {
  campaignId: string;
  playerId: string;
  locationId?: string;
  message?: string;
}

const parseBody = (body: IBody) => {
  if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
  if (typeof body.campaignId !== 'string' || !body.campaignId.trim()) throw new Error('campaignId обязателен.');
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');
  const locationId = typeof body.locationId === 'string' && body.locationId.trim() ? body.locationId.trim() : undefined;
  const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : undefined;
  return {
    campaignId: body.campaignId.trim(),
    playerId: body.playerId.trim(),
    locationId,
    message,
  };
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IBody>(req);
    return ok(await describeLocation(parseBody(body)));
  } catch (e) {
    return toErrorResponse(e);
  }
};
