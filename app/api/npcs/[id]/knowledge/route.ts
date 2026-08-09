import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ICreateNpcKnowledge } from '@/domain/npc';
import { createNpcKnowledge } from '@/services/npc/crud/createNpcKnowledge';
import { listNpcKnowledge } from '@/services/npc/crud/listNpcKnowledge';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await listNpcKnowledge(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<Omit<ICreateNpcKnowledge, 'npcId'>>(req);
    return ok(await createNpcKnowledge({ ...body, npcId: id }), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
