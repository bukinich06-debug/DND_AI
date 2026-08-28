import { parseJson } from '@/app/api/_shared/parseJson';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import { goToLocation } from '@/services/player/location/goToLocation';

interface IBody {
  playerId: string;
  locationId: string;
}

const parseBody = (body: IBody) => {
  if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');
  if (typeof body.locationId !== 'string' || !body.locationId.trim()) throw new Error('locationId обязателен.');
  return { playerId: body.playerId.trim(), locationId: body.locationId.trim() };
};

export const GET = async (req: Request) => {
  try {
    const playerId = requireQuery(req.url, 'playerId');
    const player = await getPlayer(playerId);
    return ok(await getPlayerLocation({ campaignId: player.campaignId, playerId }));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request) => {
  try {
    const body = parseBody(await parseJson<IBody>(req));
    const player = await getPlayer(body.playerId);
    return ok(
      await goToLocation({
        campaignId: player.campaignId,
        playerId: body.playerId,
        locationId: body.locationId,
      })
    );
  } catch (e) {
    return toErrorResponse(e);
  }
};
