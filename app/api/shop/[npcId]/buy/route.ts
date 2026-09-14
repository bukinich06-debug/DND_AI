import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { buyFromShop } from '@/services/shop/buyFromShop';

interface IBody {
  playerId: string;
  itemId: string;
  quantity: number;
}

const parseBody = (body: IBody, npcId: string) => {
  if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');
  if (typeof body.itemId !== 'string' || !body.itemId.trim()) throw new Error('itemId обязателен.');
  if (typeof body.quantity !== 'number' || !Number.isInteger(body.quantity) || body.quantity < 1)
    throw new Error('quantity должно быть положительным целым числом.');

  return {
    campaignId: '',
    playerId: body.playerId.trim(),
    npcId,
    itemId: body.itemId.trim(),
    quantity: body.quantity,
  };
};

export const POST = async (req: Request, { params }: { params: Promise<{ npcId: string }> }) => {
  try {
    const { npcId } = await params;
    const body = await parseJson<IBody>(req);
    const input = parseBody(body, npcId);
    return ok(await buyFromShop(input));
  } catch (e) {
    return toErrorResponse(e);
  }
};
