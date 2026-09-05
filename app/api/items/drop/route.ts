import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IDropItem } from '@/domain/item';
import { dropItem } from '@/services/item/transfer/dropItem';

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IDropItem>(req);
    return ok(await dropItem(body));
  } catch (e) {
    return toErrorResponse(e);
  }
};
