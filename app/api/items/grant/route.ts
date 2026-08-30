import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IGrantCatalogItem } from '@/domain/item';
import { grantCatalogItem } from '@/services/item/catalog/grantCatalogItem';

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IGrantCatalogItem>(req);
    const result = await grantCatalogItem(body);
    return ok(result, 201);
  } catch (e) {
    return toErrorResponse(e);
  }
};
