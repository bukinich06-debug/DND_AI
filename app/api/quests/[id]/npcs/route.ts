import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IAddQuestNpc } from '@/domain/quest';
import { addQuestNpc } from '@/services/quest/crud/addQuestNpc';
import { listQuestNpcs } from '@/services/quest/crud/listQuestNpcs';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await listQuestNpcs(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<Omit<IAddQuestNpc, 'questId'>>(req);
    return ok(await addQuestNpc({ ...body, questId: id }), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
