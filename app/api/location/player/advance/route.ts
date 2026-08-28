import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { advanceTravel } from '@/services/player/location/advanceTravel';

interface IBody {
  playerId: string;
  days?: number;
}

const parseBody = (raw: unknown): IBody => {
  if (!raw || typeof raw !== 'object') throw new Error('Тело запроса обязательно.');
  const body = raw as Record<string, unknown>;
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');

  let days: number | undefined;
  if (body.days !== undefined) {
    if (typeof body.days !== 'number' || !Number.isInteger(body.days) || body.days < 1)
      throw new Error('days должен быть целым числом не меньше 1.');
    days = body.days;
  }

  return { playerId: body.playerId.trim(), days };
};

export const POST = async (req: Request) => {
  try {
    const text = await req.text();
    if (!text.trim()) throw new Error('Тело запроса обязательно.');
    let raw: unknown;
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      throw new Error('Некорректный JSON.');
    }
    const body = parseBody(raw);
    const player = await getPlayer(body.playerId);
    return ok(
      await advanceTravel({
        campaignId: player.campaignId,
        playerId: body.playerId,
        ...(body.days !== undefined ? { days: body.days } : {}),
      })
    );
  } catch (e) {
    return toErrorResponse(e);
  }
};
