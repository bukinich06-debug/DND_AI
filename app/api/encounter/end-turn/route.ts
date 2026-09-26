import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { endPlayerTurn } from '@/services/encounter/endPlayerTurn';
import { getActiveEncounter } from '@/services/encounter/getActiveEncounter';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { campaignId, playerId } = body;

    if (!campaignId) throw new Error('campaignId обязателен.');
    if (!playerId) throw new Error('playerId обязателен.');

    const result = await endPlayerTurn({
      campaignId,
      playerId,
    });

    if (!result.success) {
      return Response.json(
        {
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    const encounterState = await getActiveEncounter({
      campaignId,
      playerId,
    });

    return ok({
      success: true,
      encounter: encounterState.encounter,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
};
