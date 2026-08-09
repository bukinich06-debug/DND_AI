import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateItem } from '@/domain/item';
import { deleteItem } from '@/services/item/crud/deleteItem';
import { getItem } from '@/services/item/crud/getItem';
import { updateItem } from '@/services/item/crud/updateItem';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getItem(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateItem>(req);
    return ok(await updateItem(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteItem(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
