import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateNpcKnowledge } from '@/domain/npc';
import { deleteNpcKnowledge } from '@/services/npc/crud/deleteNpcKnowledge';
import { getNpcKnowledge } from '@/services/npc/crud/getNpcKnowledge';
import { updateNpcKnowledge } from '@/services/npc/crud/updateNpcKnowledge';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getNpcKnowledge(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateNpcKnowledge>(req);
    return ok(await updateNpcKnowledge(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteNpcKnowledge(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
