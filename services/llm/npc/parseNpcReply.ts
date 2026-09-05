import { parseRequestedCheck, type IRequestedCheck } from '@/services/llm/check/parseRequestedCheck';

export interface INpcReply {
  say: string;
  do: string | null;
  check?: IRequestedCheck | null;
}

const tryParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractJsonObject = (raw: string) => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return tryParseJson(raw.slice(start, end + 1));
};

const asReply = (value: unknown): INpcReply | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;

  let check: IRequestedCheck | null = null;
  if (obj.check !== undefined && obj.check !== null) {
    check = parseRequestedCheck(obj.check);
    if (!check) return null;
  }

  if (obj.say !== undefined && obj.say !== null && typeof obj.say !== 'string') return null;
  const speech = typeof obj.say === 'string' ? obj.say.trim() : '';
  if (!check && !speech) return null;

  let action: string | null = null;
  if (obj.do === null || obj.do === undefined) action = null;
  else if (typeof obj.do === 'string') action = obj.do.trim() || null;
  else return null;

  return { say: speech, do: action, check };
};

export const parseNpcReply = (raw: string): INpcReply => {
  const trimmed = raw.trim();
  const parsed = asReply(tryParseJson(trimmed)) ?? asReply(extractJsonObject(trimmed));
  if (parsed) return parsed;
  return { say: trimmed, do: null, check: null };
};
