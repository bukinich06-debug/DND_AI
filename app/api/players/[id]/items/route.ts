import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IGrantCatalogItem } from '@/domain/item';
import { grantCatalogItem } from '@/services/item/catalog/grantCatalogItem';

interface IParams {
  params: Promise<{ id: string }>;
}

export const POST = async (req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    const body = await parseJson<Omit<IGrantCatalogItem, 'playerId'>>(req);
    return ok(await grantCatalogItem({ ...body, playerId: id }), 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
