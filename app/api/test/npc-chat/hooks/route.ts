import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { getTurn } from '@/services/llm/hooks/store/hookLogStore';

export const GET = async (req: Request) => {
  try {
    const turnId = new URL(req.url).searchParams.get('turnId')?.trim() || '';
    if (!turnId) throw new Error('turnId обязателен.');

    const hooks = getTurn(turnId);
    if (!hooks) throw new Error('Ход post-hooks не найден.');

    return ok({ hooks });
  } catch (e) {
    return toErrorResponse(e);
  }
};
