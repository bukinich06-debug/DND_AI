import { Condition, CONDITION_ALIASES, Skill, SKILL_ALIASES, Tool, TOOL_ALIASES } from '../constants';

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/[''`]/g, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

const keyAsPhrase = (key: string) => normalizeText(key.replace(/([A-Z])/g, ' $1'));

export const normalizeSkillKey = (input: string): Skill | null => {
  const q = normalizeText(input);
  if (!q) return null;

  for (const key of Object.values(Skill)) {
    if (normalizeText(key) === q || keyAsPhrase(key) === q) return key;
    if (SKILL_ALIASES[key].some((alias) => normalizeText(alias) === q)) return key;
  }

  return null;
};

export const normalizeToolKey = (input: string): Tool | null => {
  const q = normalizeText(input);
  if (!q) return null;

  for (const key of Object.values(Tool)) {
    if (normalizeText(key) === q || keyAsPhrase(key) === q) return key;
    if (TOOL_ALIASES[key].some((alias) => normalizeText(alias) === q)) return key;
  }

  return null;
};

export const normalizeConditionKey = (input: string): Condition | null => {
  const q = normalizeText(input);
  if (!q) return null;

  for (const key of Object.values(Condition)) {
    if (normalizeText(key) === q || keyAsPhrase(key) === q) return key;
    if (CONDITION_ALIASES[key].some((alias) => normalizeText(alias) === q)) return key;
  }

  return null;
};

export const textIncludes = (haystack: string, needle: string) =>
  normalizeText(haystack).includes(normalizeText(needle));

export { normalizeText };
