import { parseJson } from '@/app/api/_shared/parseJson';
import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { parseTurnResume } from '@/services/llm/turn/parseTurnResume';
import { runPlayerTurn } from '@/services/llm/turn/runPlayerTurn';

interface IBody {
  campaignId: string;
  playerId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  resume?: unknown;
  check?: unknown;
  rollId?: unknown;
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

const parseBody = (body: IBody) => {
  if (!body || typeof body !== 'object') throw new Error('Тело запроса обязательно.');
  if (typeof body.campaignId !== 'string' || !body.campaignId.trim()) throw new Error('campaignId обязателен.');
  if (typeof body.playerId !== 'string' || !body.playerId.trim()) throw new Error('playerId обязателен.');

  const resume = body.resume !== undefined && body.resume !== null ? parseTurnResume(body.resume) : undefined;
  const check = parseCheck(body.check);
  let rollId: string | undefined;
  if (body.rollId !== undefined && body.rollId !== null) {
    if (typeof body.rollId !== 'string' || !body.rollId.trim()) throw new Error('rollId должен быть строкой.');
    rollId = body.rollId.trim();
  }

  if (resume && (!check || !rollId)) throw new Error('Для продолжения нужны resume, check и rollId.');

  return {
    campaignId: body.campaignId.trim(),
    playerId: body.playerId.trim(),
    messages: body.messages,
    resume,
    check,
    rollId,
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
