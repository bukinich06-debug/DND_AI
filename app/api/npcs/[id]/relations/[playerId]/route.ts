import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import { deleteNpcRelation } from '@/services/npc/relation/deleteNpcRelation';
import { getNpcRelation } from '@/services/npc/relation/getNpcRelation';
import { setNpcRelation } from '@/services/npc/relation/setNpcRelation';

interface IParams {
  params: Promise<{ id: string; playerId: string }>;
}

interface ISetBody {
  score: number;
  note?: string | null;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id, playerId } = await params;
    return ok(await getNpcRelation(id, playerId));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PUT = async (req: Request, { params }: IParams) => {
  try {
    const { id, playerId } = await params;
    const body = await parseJson<ISetBody>(req);
    return ok(await setNpcRelation({ npcId: id, playerId, score: body.score, note: body.note }));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id, playerId } = await params;
    await deleteNpcRelation(id, playerId);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
