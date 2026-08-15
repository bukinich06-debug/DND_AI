import { ensureLocationLink } from '@/services/location-link/crud/ensureLocationLink';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  fromId: string;
  toId: string;
  days?: number;
  label?: string | null;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы дороги обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.fromId !== 'string' || !raw.fromId.trim()) throw new Error('fromId обязателен.');
  if (typeof raw.toId !== 'string' || !raw.toId.trim()) throw new Error('toId обязателен.');

  let days: number | undefined;
  if (raw.days !== undefined) {
    if (typeof raw.days !== 'number' || !Number.isInteger(raw.days) || raw.days < 1)
      throw new Error('days должен быть целым числом не меньше 1.');
    days = raw.days;
  }

  let label: string | null | undefined;
  if (raw.label === undefined) label = undefined;
  else if (raw.label === null) label = null;
  else if (typeof raw.label === 'string') label = raw.label.trim() || null;
  else throw new Error('label должен быть строкой.');

  return { fromId: raw.fromId.trim(), toId: raw.toId.trim(), days, label };
};

export const ensureLocationLinkTool: ILlmTool = {
  name: 'ensure_location_link',
  description:
    'Гарантирует дорогу между двумя поселениями (settlement). Если ребро уже есть в любую сторону — ничего не создаёт. Для уже существующих мест, о которых сказали «соседняя» / «день пути». Новое поселение линкуется само в create_mentioned_location.',
  parameters: {
    type: 'object',
    properties: {
      fromId: { type: 'string', description: 'ID текущего поселения' },
      toId: { type: 'string', description: 'ID другого поселения' },
      days: { type: 'number', description: 'Дни пути; по умолчанию 1' },
      label: { type: 'string', description: 'Подпись дороги' },
    },
    required: ['fromId', 'toId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    return ensureLocationLink({
      campaignId: ctx.campaignId,
      fromId: parsed.fromId,
      toId: parsed.toId,
      ...(parsed.days !== undefined ? { days: parsed.days } : {}),
      ...(parsed.label !== undefined ? { label: parsed.label } : {}),
    });
  },
};
