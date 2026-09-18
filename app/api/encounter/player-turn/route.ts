import { runPlayerCombatTurn } from '@/services/llm/combat';
import { getActiveEncounter } from '@/services/encounter/getActiveEncounter';
import { NextRequest, NextResponse } from 'next/server';

interface IRequestBody {
  campaignId: string;
  encounterId: string;
  playerId: string;
  playerAction: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as IRequestBody;

    if (!body.campaignId?.trim()) {
      return NextResponse.json({ error: 'campaignId обязателен.', errorCode: 'MISSING_CAMPAIGN_ID' }, { status: 400 });
    }
    if (!body.encounterId?.trim()) {
      return NextResponse.json(
        { error: 'encounterId обязателен.', errorCode: 'MISSING_ENCOUNTER_ID' },
        { status: 400 }
      );
    }
    if (!body.playerId?.trim()) {
      return NextResponse.json({ error: 'playerId обязателен.', errorCode: 'MISSING_PLAYER_ID' }, { status: 400 });
    }
    if (!body.playerAction?.trim()) {
      return NextResponse.json(
        { error: 'playerAction обязателен.', errorCode: 'MISSING_PLAYER_ACTION' },
        { status: 400 }
      );
    }

    const result = await runPlayerCombatTurn({
      campaignId: body.campaignId,
      encounterId: body.encounterId,
      playerId: body.playerId,
      playerAction: body.playerAction,
    });

    const encounterState = await getActiveEncounter({
      campaignId: body.campaignId,
      playerId: body.playerId,
    });

    return NextResponse.json({
      success: true,
      say: result.say,
      do: result.do,
      toolCalls: result.toolCalls,
      encounter: encounterState.encounter,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Неизвестная ошибка';

    if (message.startsWith('NOT_PLAYER_TURN:')) {
      return NextResponse.json(
        { error: message.replace('NOT_PLAYER_TURN: ', ''), errorCode: 'NOT_PLAYER_TURN' },
        { status: 400 }
      );
    }

    if (message === 'Боевая сцена не активна.') {
      return NextResponse.json({ error: message, errorCode: 'ENCOUNTER_NOT_ACTIVE' }, { status: 400 });
    }

    return NextResponse.json({ error: message, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
  }
};
