import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { applyPlayerHp } from '@/services/player/hp/applyPlayerHp';
import { getPlayer } from '@/services/player/crud/getPlayer';

interface IParams {
  params: Promise<{ id: string }>;
}

interface IBody {
  delta: number;
}

export const POST = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IBody>(req);
    if (!body || typeof body !== 'object' || !Number.isInteger(body.delta))
      throw new Error('delta должен быть целым числом.');
    const player = await getPlayer(id);
    return ok(await applyPlayerHp({ campaignId: player.campaignId, playerId: id, delta: body.delta }));
  } catch (e) {
    return toErrorResponse(e);
  }
};
