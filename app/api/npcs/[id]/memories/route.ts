import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ICreateNpcMemory } from '@/domain/npc';
import { createNpcMemory } from '@/services/npc/memory/createNpcMemory';
import { listNpcMemories } from '@/services/npc/memory/listNpcMemories';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const playerIdParam = url.searchParams.get('playerId');
    const minImportanceParam = url.searchParams.get('minImportance');

    const filter = {
      ...(playerIdParam !== null ? { playerId: playerIdParam === '' ? null : playerIdParam } : {}),
      ...(minImportanceParam !== null ? { minImportance: Number(minImportanceParam) } : {}),
    };

    return ok(await listNpcMemories(id, Object.keys(filter).length ? filter : undefined));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const POST = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<Omit<ICreateNpcMemory, 'npcId'>>(req);
    return ok(await createNpcMemory({ ...body, npcId: id }), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
