import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { longRest } from '@/services/player/rest/longRest';
import { shortRest } from '@/services/player/rest/shortRest';

interface IParams {
  params: Promise<{ id: string }>;
}

interface IBody {
  kind: 'short' | 'long';
  hitDice?: number;
}

export const POST = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IBody>(req);
    if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
    if (body.kind !== 'short' && body.kind !== 'long') throw new Error('kind должен быть short или long.');

    const player = await getPlayer(id);
    if (body.kind === 'long') return ok(await longRest({ campaignId: player.campaignId, playerId: id }));

    if (!Number.isInteger(body.hitDice)) throw new Error('Для короткого отдыха нужен hitDice.');
    return ok(await shortRest({ campaignId: player.campaignId, playerId: id, hitDice: body.hitDice as number }));
  } catch (e) {
    return toErrorResponse(e);
  }
};
