import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { listNpcRelations } from '@/services/npc/relation/listNpcRelations';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await listNpcRelations(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};
