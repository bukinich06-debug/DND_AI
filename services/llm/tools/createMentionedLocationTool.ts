import { LocationKind, STUB_UNKNOWN } from '@/domain/shared';
import { resolveMentionParentId } from '@/domain/location';
import { createLocation } from '@/services/location/crud/createLocation';
import { loadMentionAnchor } from '@/services/location/helpers/loadMentionAnchor';
import { ensureLocationLink } from '@/services/location-link/crud/ensureLocationLink';
import type { ILlmTool, IToolContext } from './types';

const kinds = new Set<string>(Object.values(LocationKind));

interface IArgs {
  name: string;
  kind: LocationKind;
  containerId?: string;
  tags?: string[];
  days?: number;
  summary?: string;
  description?: string;
  features?: string;
}

const parseStubField = (raw: unknown, field: string): string => {
  if (raw === undefined || raw === null) return STUB_UNKNOWN;
  if (typeof raw !== 'string') throw new Error(`${field} должен быть строкой.`);
  return raw.trim() || STUB_UNKNOWN;
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
  if (!args || typeof args !== 'object') throw new Error('Аргументы создания локации обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.name !== 'string' || !raw.name.trim()) throw new Error('name обязателен.');
  if (typeof raw.kind !== 'string' || !kinds.has(raw.kind))
    throw new Error('kind обязателен и должен быть типом локации.');

  let containerId: string | undefined;
  if (raw.containerId !== undefined) {
    if (typeof raw.containerId !== 'string' || !raw.containerId.trim())
      throw new Error('containerId должен быть непустой строкой.');
    containerId = raw.containerId.trim();
  }

  let days: number | undefined;
  if (raw.days !== undefined) {
    if (typeof raw.days !== 'number' || !Number.isInteger(raw.days) || raw.days < 1)
      throw new Error('days должен быть целым числом не меньше 1.');
    days = raw.days;
  }

  return {
    name: raw.name.trim(),
    kind: raw.kind as LocationKind,
    containerId,
    tags: parseTags(raw.tags),
    days,
    summary: parseStubField(raw.summary, 'summary'),
    description: parseStubField(raw.description, 'description'),
    features: parseStubField(raw.features, 'features'),
  };
};

export const createMentionedLocationTool: ILlmTool = {
  name: 'create_mentioned_location',
  description:
    'Создаёт stub локации из упоминания. parentId ставит сервер: для здания — текущее поселение или containerId (уже найденная деревня/город); для поселения — тот же регион, что у текущей деревни, плюс дорога. Сначала search_location и списки here/neighbors. Не выдумывай описание — опусти поля. Не передавай parentId.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Как назвали место (Кузня, Бережок)' },
      kind: {
        type: 'string',
        enum: Object.values(LocationKind),
        description:
          'Тип: building (кузня/таверна), settlement (деревня/город), room, district, region, dungeon, wilderness, other',
      },
      containerId: {
        type: 'string',
        description: 'ID уже найденного контейнера (деревня Б для «кузни в Б»). Без него — текущее поселение/здание',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Роли-синонимы латиницей и по-русски: smithy, кузница',
      },
      days: {
        type: 'number',
        description: 'Дни пути до нового поселения («день пути»=1). Только для kind=settlement',
      },
      summary: { type: 'string', description: 'Кратко; если неизвестно — опусти' },
      description: { type: 'string', description: 'Описание; если неизвестно — опусти' },
      features: { type: 'string', description: 'Особенности; если неизвестно — опусти' },
    },
    required: ['name', 'kind'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const speakerId = ctx.npcId?.trim();
    const { byId, anchor } = await loadMentionAnchor({
      campaignId: ctx.campaignId,
      playerId: ctx.playerId,
      npcId: ctx.npcId,
    });

    if (parsed.containerId) {
      const container = byId.get(parsed.containerId);
      if (!container) throw new Error('Контейнер локации не найден.');
      if (container.campaignId !== ctx.campaignId) throw new Error('Контейнер из другой кампании.');
    }

    const parentId = resolveMentionParentId(parsed.kind, parsed.containerId, anchor);
    const autoTag = speakerId ? `auto:mentioned-by:${speakerId}` : 'auto:mentioned';
    const tags = [...new Set([autoTag, ...(parsed.tags ?? [])])];

    const location = await createLocation({
      campaignId: ctx.campaignId,
      parentId,
      kind: parsed.kind,
      name: parsed.name,
      summary: parsed.summary ?? STUB_UNKNOWN,
      description: parsed.description ?? STUB_UNKNOWN,
      features: parsed.features ?? STUB_UNKNOWN,
      isSecret: false,
      tags,
    });

    let link = null;
    if (parsed.kind === LocationKind.settlement && anchor.settlementId && anchor.settlementId !== location.id) {
      link = await ensureLocationLink({
        campaignId: ctx.campaignId,
        fromId: anchor.settlementId,
        toId: location.id,
        days: parsed.days ?? 1,
      });
    }

    return { location, link };
  },
};
