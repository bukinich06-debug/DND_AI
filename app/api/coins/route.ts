import { requireQuery } from '@/app/api/_shared/requireQuery';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { CoinOwnerKind } from '@/domain/coins';
import { getCoins } from '@/services/coins/get/getCoins';

export const GET = async (req: Request) => {
  try {
    const campaignId = requireQuery(req.url, 'campaignId');
    const playerId = requireQuery(req.url, 'playerId');
    return ok(
      await getCoins({
        campaignId,
        owner: { kind: CoinOwnerKind.player, id: playerId },
      })
    );
  } catch (e) {
    return toErrorResponse(e);
  }
};
