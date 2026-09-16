import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { parseTurnResume } from '@/services/llm/turn/parseTurnResume';
import { runPlayerTurn } from '@/services/llm/turn/runPlayerTurn';

interface IBody {
  campaignId: string;
  playerId: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  resume?: unknown;
  check?: unknown;
  rollId?: unknown;
  postPurchase?: unknown;
}

const parseCheck = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('check некорректен.');
  const obj = value as Record<string, unknown>;
  if (typeof obj.skill !== 'string' || !obj.skill.trim()) throw new Error('check.skill обязателен.');
  if (typeof obj.dc !== 'number' || !Number.isFinite(obj.dc)) throw new Error('check.dc обязателен.');
  let knowledgeId: string | null = null;
  if (obj.knowledgeId !== undefined && obj.knowledgeId !== null) {
    if (typeof obj.knowledgeId !== 'string') throw new Error('check.knowledgeId должен быть строкой.');
    knowledgeId = obj.knowledgeId.trim() || null;
  }
  return { skill: obj.skill.trim(), dc: obj.dc, knowledgeId };
};

const parsePostPurchase = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('postPurchase некорректен.');
  const obj = value as Record<string, unknown>;
  if (typeof obj.npcId !== 'string' || !obj.npcId.trim()) throw new Error('postPurchase.npcId обязателен.');
  if (typeof obj.itemName !== 'string' || !obj.itemName.trim()) throw new Error('postPurchase.itemName обязателен.');
  if (typeof obj.quantity !== 'number' || !Number.isInteger(obj.quantity) || obj.quantity < 1)
    throw new Error('postPurchase.quantity должен быть положительным целым числом.');
  if (typeof obj.totalPriceCp !== 'number' || !Number.isInteger(obj.totalPriceCp) || obj.totalPriceCp < 0)
    throw new Error('postPurchase.totalPriceCp должен быть неотрицательным целым числом.');
  return {
    npcId: obj.npcId.trim(),
    itemName: obj.itemName.trim(),
    quantity: obj.quantity,
    totalPriceCp: obj.totalPriceCp,
  };
};

const parseBody = (body: IBody) => {
  if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
  if (typeof body.campaignId !== 'string' || !body.campaignId.trim()) throw new Error('campaignId обязателен.');
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');

  const resume = body.resume !== undefined && body.resume !== null ? parseTurnResume(body.resume) : undefined;
  const check = parseCheck(body.check);
  const postPurchase = parsePostPurchase(body.postPurchase);
  let rollId: string | undefined;
  if (body.rollId !== undefined && body.rollId !== null) {
    if (typeof body.rollId !== 'string' || !body.rollId.trim()) throw new Error('rollId должен быть строкой.');
    rollId = body.rollId.trim();
  }

  const messages = body.messages ?? [];
  if (!postPurchase && messages.length === 0) throw new Error('messages обязательны для обычных ходов.');

  if (resume && (!check || !rollId)) throw new Error('Для продолжения нужны resume, check и rollId.');
  if (postPurchase && resume) throw new Error('postPurchase не может использоваться вместе с resume.');

  return {
    campaignId: body.campaignId.trim(),
    playerId: body.playerId.trim(),
    messages,
    resume,
    check,
    rollId,
    postPurchase,
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
