export type IPlanStep =
  | { agent: 'world'; locationId: string; locationName: string }
  | { agent: 'npc'; npcId: string; npcName: string }
  | { agent: 'master' };

export type IParsedPlanStep =
  { agent: 'world'; locationId: string } | { agent: 'npc'; npcId: string } | { agent: 'master' };

const tryParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractJson = (raw: string) => {
  const arrStart = raw.indexOf('[');
  const arrEnd = raw.lastIndexOf(']');
  const objStart = raw.indexOf('{');
  const objEnd = raw.lastIndexOf('}');

  if (arrStart >= 0 && arrEnd > arrStart && (objStart < 0 || arrStart < objStart))
    return tryParseJson(raw.slice(arrStart, arrEnd + 1));
  if (objStart >= 0 && objEnd > objStart) return tryParseJson(raw.slice(objStart, objEnd + 1));
  return null;
};

const asError = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.error !== 'string' || !obj.error.trim()) return null;
  return obj.error.trim();
};

const asStep = (value: unknown, index: number): IParsedPlanStep => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`steps[${index}] некорректен.`);
  const obj = value as Record<string, unknown>;
  const agent = obj.agent;

  if (agent === 'world') {
    if (typeof obj.locationId !== 'string' || !obj.locationId.trim())
      throw new Error(`steps[${index}].locationId обязателен.`);
    return { agent: 'world', locationId: obj.locationId.trim() };
  }
  if (agent === 'npc') {
    if (typeof obj.npcId !== 'string' || !obj.npcId.trim()) throw new Error(`steps[${index}].npcId обязателен.`);
    return { agent: 'npc', npcId: obj.npcId.trim() };
  }
  if (agent === 'master') return { agent: 'master' };

  throw new Error(`steps[${index}].agent должен быть world, npc или master.`);
};

const asStepList = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'agent' in (value as object)) return [value];
  return null;
};

export const parsePlanReply = (raw: string): IParsedPlanStep[] => {
  const trimmed = raw.trim();
  const parsed = tryParseJson(trimmed) ?? extractJson(trimmed);
  console.log('parsed', parsed);

  const error = asError(parsed);
  if (error) throw new Error(error);

  const list = asStepList(parsed);
  console.log('list', list);
  if (!list) throw new Error('Ответ планировщика должен быть JSON-массивом шагов.');
  if (list.length === 0) throw new Error('План не должен быть пустым.');

  return list.map((item, index) => asStep(item, index));
};
