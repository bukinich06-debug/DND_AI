import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateNpcMemory } from '@/domain/npc';
import { deleteNpcMemory } from '@/services/npc/memory/deleteNpcMemory';
import { getNpcMemory } from '@/services/npc/memory/getNpcMemory';
import { updateNpcMemory } from '@/services/npc/memory/updateNpcMemory';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getNpcMemory(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateNpcMemory>(req);
    return ok(await updateNpcMemory(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteNpcMemory(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
