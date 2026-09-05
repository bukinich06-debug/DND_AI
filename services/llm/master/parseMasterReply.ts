export const MASTER_VERDICTS = ['allowed', 'denied', 'partial', 'check', 'defer_combat'] as const;

export type MasterVerdict = (typeof MASTER_VERDICTS)[number];

export interface IMasterReply {
  verdict: MasterVerdict;
  say: string;
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

const isVerdict = (value: unknown): value is MasterVerdict =>
  typeof value === 'string' && (MASTER_VERDICTS as readonly string[]).includes(value);

const asReply = (value: unknown): IMasterReply | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (!isVerdict(obj.verdict)) return null;
  if (typeof obj.say !== 'string' || !obj.say.trim()) return null;
  return { verdict: obj.verdict, say: obj.say.trim() };
};

export const parseMasterReply = (raw: string): IMasterReply => {
  const trimmed = raw.trim();
  const parsed = asReply(tryParseJson(trimmed)) ?? asReply(extractJsonObject(trimmed));
  if (parsed) return parsed;
  return { verdict: 'partial', say: trimmed };
};
