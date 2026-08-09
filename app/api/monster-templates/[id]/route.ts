import { parseJson } from '@/app/api/_shared/parseJson';
import { noContent, ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUpdateMonsterTemplate } from '@/domain/monster-template';
import { deleteMonsterTemplate } from '@/services/monster-template/crud/deleteMonsterTemplate';
import { getMonsterTemplate } from '@/services/monster-template/crud/getMonsterTemplate';
import { updateMonsterTemplate } from '@/services/monster-template/crud/updateMonsterTemplate';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await getMonsterTemplate(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const PATCH = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<IUpdateMonsterTemplate>(req);
    return ok(await updateMonsterTemplate(id, body));
  } catch (e) {
    return toErrorResponse(e);
  }
};

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    await deleteMonsterTemplate(id);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
