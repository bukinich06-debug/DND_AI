import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import type { ITransferCoins } from '@/domain/coins';
import { transferCoins } from '@/services/coins/transfer/transferCoins';

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<ITransferCoins>(req);
    return ok(await transferCoins(body));
  } catch (e) {
    return toErrorResponse(e);
  }
};
