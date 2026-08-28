import { requireQuery } from '@/app/api/_shared/requireQuery';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { listNpcsAtPlayerLocation } from '@/services/npc/crud/listNpcsAtPlayerLocation';

export const GET = async (req: Request) => {
  try {
    const playerId = requireQuery(req.url, 'playerId');
    return ok(await listNpcsAtPlayerLocation(playerId));
  } catch (e) {
    return toErrorResponse(e);
  }
};
