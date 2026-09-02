import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { runPlayerTurn } from '@/services/llm/turn/runPlayerTurn';

interface IBody {
  campaignId: string;
  playerId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const parseBody = (body: IBody) => {
  if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
  if (typeof body.campaignId !== 'string' || !body.campaignId.trim()) throw new Error('campaignId обязателен.');
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');

  return {
    campaignId: body.campaignId.trim(),
    playerId: body.playerId.trim(),
    messages: body.messages,
  };
};

export const POST = async (req: Request) => {
  try {
    const body = await parseJson<IBody>(req);
    return ok(await runPlayerTurn(parseBody(body)));
  } catch (e) {
    return toErrorResponse(e);
  }
};
