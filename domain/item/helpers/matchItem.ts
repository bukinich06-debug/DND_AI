import { TOOL_ALIASES, type Tool } from '@/domain/player/constants';
import { normalizeText, normalizeToolKey, textIncludes } from '@/domain/player/helpers/normalizeKey';
import type { IItem } from '../types';

export interface IMatchedItem {
  id: string;
  name: string;
  kind: IItem['kind'];
  quantity: number;
  description: string;
  properties: IItem['properties'];
  isMagical: boolean;
  equipSlot: IItem['equipSlot'];
  score: number;
  toolKey: Tool | null;
}

export interface IMatchItemsResult {
  exact: boolean;
  items: IMatchedItem[];
}

const toMatched = (item: IItem, score: number, toolKey: Tool | null = null): IMatchedItem => ({
  id: item.id,
  name: item.name,
  kind: item.kind,
  quantity: item.quantity,
  description: item.description,
  properties: item.properties,
  isMagical: item.isMagical,
  equipSlot: item.equipSlot,
  score,
  toolKey,
});

const toolAliases = (key: Tool) => TOOL_ALIASES[key];

const scoreAgainstTool = (item: IItem, toolKey: Tool): number => {
  const name = normalizeText(item.name);
  for (const alias of toolAliases(toolKey)) {
    const a = normalizeText(alias);
    if (name === a) return 100;
    if (name.includes(a) || a.includes(name)) return 80;
  }
  return 0;
};

const scoreAgainstQuery = (item: IItem, query: string): number => {
  const q = normalizeText(query);
  if (!q) return 0;

  const name = normalizeText(item.name);
  if (name === q) return 90;
  if (name.includes(q)) return 70;
  if (q.includes(name) && name.length >= 3) return 60;
  if (textIncludes(item.description, q)) return 40;
  return 0;
};

export const matchItems = (items: IItem[], query?: string | null): IMatchItemsResult => {
  const trimmed = query?.trim() ?? '';
  if (!trimmed)
    return {
      exact: false,
      items: items.map((item) => toMatched(item, 0)),
    };

  const toolKey = normalizeToolKey(trimmed);
  const scored: IMatchedItem[] = [];

  for (const item of items) {
    let score = 0;
    let matchedTool: Tool | null = null;

    if (toolKey) {
      const toolScore = scoreAgainstTool(item, toolKey);
      if (toolScore > score) {
        score = toolScore;
        matchedTool = toolKey;
      }
    }

    const queryScore = scoreAgainstQuery(item, trimmed);
    if (queryScore > score) score = queryScore;

    if (score > 0) scored.push(toMatched(item, score, matchedTool));
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ru'));

  const exact = Boolean(toolKey && scored.length === 1 && scored[0].score >= 80);

  return { exact, items: scored };
};
