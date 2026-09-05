import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ITakeItem } from '@/domain/item';
import { takeItem } from '@/services/item/transfer/takeItem';

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ITakeItem>(req);
    return ok(await takeItem(body));
  } catch (e) {
    return toErrorResponse(e);
  }
};
