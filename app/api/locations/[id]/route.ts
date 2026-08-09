import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateLocation } from '@/domain/location';
import { deleteLocation } from '@/services/location/crud/deleteLocation';
import { getLocation } from '@/services/location/crud/getLocation';
import { updateLocation } from '@/services/location/crud/updateLocation';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getLocation(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateLocation>(req);
    return ok(await updateLocation(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteLocation(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
