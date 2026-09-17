import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { advanceCombatTurn } from '@/services/encounter/advanceCombatTurn';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { campaignId, playerId } = body;

    if (!campaignId) throw new Error('campaignId обязателен.');

    return ok(
      await advanceCombatTurn({
        campaignId,
        playerId: playerId ?? undefined,
      })
    );
  } catch (e) {
    return toErrorResponse(e);
  }
};
