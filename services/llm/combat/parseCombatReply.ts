export interface ICombatReply {
  say: string;
  do: string | null;
  rejection?: {
    rejected: boolean;
    reason: string | null;
  };
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

const asReply = (value: unknown): ICombatReply | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;

  if (obj.say !== undefined && obj.say !== null && typeof obj.say !== 'string') return null;
  const speech = typeof obj.say === 'string' ? obj.say.trim() : '';

  let action: string | null = null;
  if (obj.do === null || obj.do === undefined) action = null;
  else if (typeof obj.do === 'string') action = obj.do.trim() || null;
  else return null;

  let rejection: { rejected: boolean; reason: string | null } | undefined;
  if (obj.rejection && typeof obj.rejection === 'object') {
    const rej = obj.rejection as Record<string, unknown>;
    if (typeof rej.rejected === 'boolean') {
      rejection = {
        rejected: rej.rejected,
        reason: typeof rej.reason === 'string' ? rej.reason.trim() : null,
      };
    }
  }

  return { say: speech, do: action, rejection };
};

export const parseCombatReply = (raw: string): ICombatReply => {
  const trimmed = raw.trim();
  const parsed = asReply(tryParseJson(trimmed)) ?? asReply(extractJsonObject(trimmed));
  if (parsed) return parsed;
  return { say: trimmed, do: null };
};
