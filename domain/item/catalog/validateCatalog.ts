import { ItemKind, ItemRarity, type ItemKind as TItemKind } from '@/domain/shared';
import { parseItemProperties, validateItemProperties } from '../validation/validateProperties';
import type { IItemCatalogEntry } from './types';

const kinds = new Set<string>(Object.values(ItemKind));
const rarities = new Set<string>(Object.values(ItemRarity));

const KEY_RE = /^[a-z][a-zA-Z0-9]*$/;

const ALLOWED = new Set([
  'key',
  'aliases',
  'name',
  'kind',
  'rarity',
  'description',
  'weight',
  'valueCp',
  'isMagical',
  'properties',
]);

const parseEntry = (raw: unknown, fileKind: TItemKind, index: number): IItemCatalogEntry => {
  const where = `${fileKind}.json[${index}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error(`${where}: запись справочника должна быть объектом.`);

  const row = raw as Record<string, unknown>;
  for (const field of Object.keys(row)) {
    if (!ALLOWED.has(field)) throw new Error(`${where}: запрещённое поле «${field}».`);
  }

  if (typeof row.key !== 'string' || !KEY_RE.test(row.key))
    throw new Error(`${where}: key — латиница, с буквы, без пробелов и дефисов (например shortsword).`);

  if (!Array.isArray(row.aliases) || row.aliases.length < 1)
    throw new Error(`${where}: aliases — непустой массив строк.`);
  const aliases: string[] = [];
  for (const alias of row.aliases) {
    if (typeof alias !== 'string' || !alias.trim()) throw new Error(`${where}: каждый alias — непустая строка.`);
    aliases.push(alias.trim());
  }

  if (typeof row.name !== 'string' || !row.name.trim()) throw new Error(`${where}: name обязателен.`);
  if (typeof row.description !== 'string' || !row.description.trim())
    throw new Error(`${where}: description обязателен.`);
  if (typeof row.kind !== 'string' || !kinds.has(row.kind)) throw new Error(`${where}: неизвестный kind.`);
  if (row.kind !== fileKind) throw new Error(`${where}: kind должен быть «${fileKind}», как имя файла.`);

  if (row.rarity !== null && (typeof row.rarity !== 'string' || !rarities.has(row.rarity)))
    throw new Error(`${where}: rarity — значение из списка или null.`);

  if (row.weight !== null && (typeof row.weight !== 'number' || row.weight < 0))
    throw new Error(`${where}: weight — число ≥ 0 или null.`);
  if (row.valueCp !== null && (typeof row.valueCp !== 'number' || !Number.isInteger(row.valueCp) || row.valueCp < 0))
    throw new Error(`${where}: valueCp — целое ≥ 0 или null.`);
  if (typeof row.isMagical !== 'boolean') throw new Error(`${where}: isMagical — boolean.`);

  validateItemProperties(row.properties);

  return {
    key: row.key,
    aliases,
    name: row.name.trim(),
    kind: row.kind as TItemKind,
    rarity: row.rarity as IItemCatalogEntry['rarity'],
    description: row.description.trim(),
    weight: row.weight as number | null,
    valueCp: row.valueCp as number | null,
    isMagical: row.isMagical,
    properties: parseItemProperties(row.properties),
  };
};

export const validateCatalogFile = (raw: unknown, fileKind: TItemKind): IItemCatalogEntry[] => {
  if (!Array.isArray(raw)) throw new Error(`${fileKind}.json: корневое значение должно быть массивом.`);
  return raw.map((row, index) => parseEntry(row, fileKind, index));
};

export const assertUniqueKeys = (entries: IItemCatalogEntry[]) => {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.key)) throw new Error(`Дублирующийся key справочника: ${entry.key}.`);
    seen.add(entry.key);
  }
};
