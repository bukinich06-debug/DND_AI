import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getNpcCombatStats } from '@/services/npc/crud/getNpcCombatStats';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getNpcCombatStats(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};
