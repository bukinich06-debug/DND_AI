import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdatePlayer } from '@/domain/player';
import { deletePlayer } from '@/services/player/crud/deletePlayer';
import { getPlayer } from '@/services/player/crud/getPlayer';
import { updatePlayer } from '@/services/player/crud/updatePlayer';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getPlayer(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdatePlayer>(req);
    return ok(await updatePlayer(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deletePlayer(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
