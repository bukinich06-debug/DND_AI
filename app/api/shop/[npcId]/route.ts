import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import { getShopData } from '@/services/shop/getShopData';

export const GET = async (req: Request, { params }: { params: Promise<{ npcId: string }> }) => {
  try {
    const { npcId } = await params;
    const url = new URL(req.url);
    const playerId = requireQuery(url, 'playerId');
    return ok(await getShopData(npcId, playerId));
  } catch (e) {
    return toErrorResponse(e);
  }
};
