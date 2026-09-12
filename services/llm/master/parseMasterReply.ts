import { Skill } from '@/domain/player';
import { parseRequestedCheck, type IRequestedCheck } from '@/services/llm/check/parseRequestedCheck';

const SOCIAL_SKILLS = new Set<string>([Skill.persuasion, Skill.deception, Skill.intimidation]);

export const MASTER_VERDICTS = ['allowed', 'denied', 'partial', 'check', 'defer_combat'] as const;

export type MasterVerdict = (typeof MASTER_VERDICTS)[number];

export interface IMasterReply {
  verdict: MasterVerdict;
  say: string;
  check: IRequestedCheck | null;
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
  if (obj.verdict !== 'check') return { verdict: obj.verdict, say: obj.say.trim(), check: null };
  const check = parseRequestedCheck(obj.check);
  if (!check) return { verdict: 'partial', say: obj.say.trim(), check: null };
  if (SOCIAL_SKILLS.has(check.skill)) return { verdict: 'partial', say: obj.say.trim(), check: null };
  return { verdict: 'check', say: obj.say.trim(), check };
};

export const parseMasterReply = (raw: string): IMasterReply => {
  const trimmed = raw.trim();
  const parsed = asReply(tryParseJson(trimmed)) ?? asReply(extractJsonObject(trimmed));
  if (parsed) return parsed;

  const loose = tryParseJson(trimmed) ?? extractJsonObject(trimmed);
  if (loose && typeof loose === 'object') {
    const say = (loose as Record<string, unknown>).say;
    if (typeof say === 'string' && say.trim()) return { verdict: 'partial', say: say.trim(), check: null };
  }

  return { verdict: 'partial', say: trimmed, check: null };
};
