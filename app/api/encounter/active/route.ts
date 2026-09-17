import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getActiveEncounter } from '@/services/encounter/getActiveEncounter';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const playerId = searchParams.get('playerId');

    if (!campaignId) throw new Error('campaignId обязателен.');

    return ok(
      await getActiveEncounter({
        campaignId,
        playerId: playerId ?? undefined,
      })
    );
  } catch (e) {
    return toErrorResponse(e);
  }
};
