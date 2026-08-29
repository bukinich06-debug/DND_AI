import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { IEquipItem } from '@/domain/item';
import { equipItem } from '@/services/item/equip/equipItem';

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IEquipItem>(req);
    return ok(await equipItem(body));
  } catch (e) {
    return toErrorResponse(e);
  }
};
