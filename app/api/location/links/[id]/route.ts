import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateLocationLink } from '@/domain/location-link';
import { deleteLocationLink } from '@/services/location-link/crud/deleteLocationLink';
import { getLocationLink } from '@/services/location-link/crud/getLocationLink';
import { updateLocationLink } from '@/services/location-link/crud/updateLocationLink';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getLocationLink(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateLocationLink>(req);
    return ok(await updateLocationLink(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteLocationLink(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
