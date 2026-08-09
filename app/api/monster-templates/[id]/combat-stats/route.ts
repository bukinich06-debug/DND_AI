import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getMonsterTemplateCombatStats } from '@/services/monster-template/crud/getMonsterTemplateCombatStats';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getMonsterTemplateCombatStats(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};
