import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpsertNpcStatBlock } from '@/domain/npc';
import { deleteNpcStatBlock } from '@/services/npc/crud/deleteNpcStatBlock';
import { getNpcStatBlock } from '@/services/npc/crud/getNpcStatBlock';
import { upsertNpcStatBlock } from '@/services/npc/crud/upsertNpcStatBlock';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getNpcStatBlock(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PUT = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<Omit<IUpsertNpcStatBlock, 'npcId'>>(req);
    return ok(await upsertNpcStatBlock({ ...body, npcId: id }));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteNpcStatBlock(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
