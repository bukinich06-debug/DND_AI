export interface INpcReply {
  say: string;
  do: string | null;
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
  if (typeof obj.say !== 'string' || !obj.say.trim()) return null;

  let action: string | null = null;
  if (obj.do === null || obj.do === undefined) action = null;
  else if (typeof obj.do === 'string') action = obj.do.trim() || null;
  else return null;

  return { say: obj.say.trim(), do: action };
};

export const parseNpcReply = (raw: string): INpcReply => {
  const trimmed = raw.trim();
  const parsed = asReply(tryParseJson(trimmed)) ?? asReply(extractJsonObject(trimmed));
  if (parsed) return parsed;
  return { say: trimmed, do: null };
};
