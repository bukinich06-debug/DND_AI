import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateQuest } from '@/domain/quest';
import { deleteQuest } from '@/services/quest/crud/deleteQuest';
import { getQuest } from '@/services/quest/crud/getQuest';
import { updateQuest } from '@/services/quest/crud/updateQuest';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getQuest(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateQuest>(req);
    return ok(await updateQuest(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteQuest(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
