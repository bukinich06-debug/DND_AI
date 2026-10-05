export interface IMonsterReply {
  say: string;
  do: string | null;
}

const LEAKED_TOOL_SAY_RE = /resolve_|list_combat|move_in_combat|move_player|use_player|get_self|tool|вызыва/i;

const ATTACK_KEYWORDS = [
  'атак',
  'бью',
  'удар',
  'стреля',
  'выстрел',
  'рубл',
  'наношу',
  'нанесу',
  'наносит',
  'удари',
  'бить',
  'пораж',
  'когт',
  'укус',
  'кус',
  'бьёт',
  'бьет',
  'attack',
  'hit',
  'bite',
  'claw',
  'slash',
];

export const looksLikeAttack = (text: string): boolean => {
  if (!text.trim()) return false;
  const lower = text.toLowerCase();
  return ATTACK_KEYWORDS.some((kw) => lower.includes(kw));
};

const CYRILLIC_RE = /[а-яё]/i;

const sanitizeSay = (say: string): string => {
  if (!say.trim()) return '';
  if (LEAKED_TOOL_SAY_RE.test(say)) return '';
  if (!CYRILLIC_RE.test(say)) return '';
  return say;
};

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

const asReply = (value: unknown): IMonsterReply | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;

  if (obj.say !== undefined && obj.say !== null && typeof obj.say !== 'string') return null;
  const speech = typeof obj.say === 'string' ? obj.say.trim() : '';

  let action: string | null = null;
  if (obj.do === null || obj.do === undefined) action = null;
  else if (typeof obj.do === 'string') action = obj.do.trim() || null;
  else return null;

  return { say: sanitizeSay(speech), do: action };
};

export const parseMonsterReply = (raw: string): IMonsterReply => {
  const trimmed = raw.trim();
  const parsed = asReply(tryParseJson(trimmed)) ?? asReply(extractJsonObject(trimmed));
  if (parsed) return parsed;
  return { say: '', do: null };
};
