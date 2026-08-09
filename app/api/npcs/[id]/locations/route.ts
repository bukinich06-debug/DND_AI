import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ISetNpcLocation } from '@/domain/npc';
import { listNpcLocations } from '@/services/npc/crud/listNpcLocations';
import { setNpcLocation } from '@/services/npc/crud/setNpcLocation';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await listNpcLocations(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PUT = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<Omit<ISetNpcLocation, 'npcId'>>(req);
    return ok(await setNpcLocation({ ...body, npcId: id }));
  } catch (e) {
    return toErrorResponse(e);
  }
};
