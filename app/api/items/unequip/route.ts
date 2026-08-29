import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IUnequipItem } from '@/domain/item';
import { unequipItem } from '@/services/item/equip/unequipItem';

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IUnequipItem>(req);
    return ok(await unequipItem(body));
  } catch (e) {
    return toErrorResponse(e);
  }
};
