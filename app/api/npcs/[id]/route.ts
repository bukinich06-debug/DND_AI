import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateNpc } from '@/domain/npc';
import { deleteNpc } from '@/services/npc/crud/deleteNpc';
import { getNpc } from '@/services/npc/crud/getNpc';
import { updateNpc } from '@/services/npc/crud/updateNpc';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getNpc(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateNpc>(req);
    return ok(await updateNpc(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteNpc(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
