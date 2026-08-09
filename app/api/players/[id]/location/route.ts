import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const player = await getPlayer(id);
    return ok(await getPlayerLocation({ campaignId: player.campaignId, playerId: id }));
  } catch (e) {
    return toErrorResponse(e);
  }
};
