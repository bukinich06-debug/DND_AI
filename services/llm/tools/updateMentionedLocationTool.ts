import { getLocation } from '@/services/location/crud/getLocation';
import { updateLocation } from '@/services/location/crud/updateLocation';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  locationId: string;
  name?: string;
  summary?: string;
  description?: string;
  tags?: string[];
}

const parseOptionalString = (raw: unknown, field: string): string | undefined => {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string' || !raw.trim()) throw new Error(`${field} должен быть непустой строкой.`);
  return raw.trim();
};

const parseTags = (raw: unknown): string[] | undefined => {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) throw new Error('tags должен быть массивом строк.');
  return raw.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) throw new Error(`tags[${index}] должен быть непустой строкой.`);
    return item.trim().toLowerCase();
  });
};

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы обновления локации обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.locationId !== 'string' || !raw.locationId.trim()) throw new Error('locationId обязателен.');

  const name = parseOptionalString(raw.name, 'name');
  const summary = parseOptionalString(raw.summary, 'summary');
  const description = parseOptionalString(raw.description, 'description');
  const tags = parseTags(raw.tags);

  if (name === undefined && summary === undefined && description === undefined && tags === undefined)
    throw new Error('Нужно хотя бы одно поле для обновления.');

  return { locationId: raw.locationId.trim(), name, summary, description, tags };
};

export const updateMentionedLocationTool: ILlmTool = {
  name: 'update_mentioned_location',
  description:
    'Обновляет уже известную локацию (имя, краткое описание, теги). Когда реплика уточняет существующее место из here/neighbors/search, а не создаёт новое.',
  parameters: {
    type: 'object',
    properties: {
      locationId: { type: 'string', description: 'ID локации из контекста или search_location' },
      name: { type: 'string', description: 'Новое название' },
      summary: { type: 'string', description: 'Краткое описание' },
      description: { type: 'string', description: 'Описание' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Добавить теги-роли (сольются с уже существующими)',
      },
    },
    required: ['locationId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const existing = await getLocation(parsed.locationId);
    if (existing.campaignId !== ctx.campaignId) throw new Error('Локация из другой кампании.');

    const tags = parsed.tags ? [...new Set([...existing.tags, ...parsed.tags])] : undefined;

    return updateLocation(parsed.locationId, {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.summary !== undefined ? { summary: parsed.summary } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description } : {}),
      ...(tags !== undefined ? { tags } : {}),
    });
  },
};
