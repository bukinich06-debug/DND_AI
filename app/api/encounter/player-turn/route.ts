import { runPlayerCombatTurn } from '@/services/llm/combat';
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
      return NextResponse.json({ error: 'campaignId обязателен.' }, { status: 400 });
    }
    if (!body.encounterId?.trim()) {
      return NextResponse.json({ error: 'encounterId обязателен.' }, { status: 400 });
    }
    if (!body.playerId?.trim()) {
      return NextResponse.json({ error: 'playerId обязателен.' }, { status: 400 });
    }
    if (!body.playerAction?.trim()) {
      return NextResponse.json({ error: 'playerAction обязателен.' }, { status: 400 });
    }

    const result = await runPlayerCombatTurn({
      campaignId: body.campaignId,
      encounterId: body.encounterId,
      playerId: body.playerId,
      playerAction: body.playerAction,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
