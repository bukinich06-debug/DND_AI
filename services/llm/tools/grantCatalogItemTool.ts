import { grantCatalogItem } from '@/services/item/catalog/grantCatalogItem';
import { grantCatalogItemToLocation } from '@/services/item/catalog/grantCatalogItemToLocation';
import type { ILlmTool, IToolContext } from './types';

interface IGrantCatalogItemArgs {
  key: string;
  target: 'player' | 'location';
  playerId?: string;
  locationId?: string;
  quantity?: number;
}

const parseArgs = (args: unknown, ctx: IToolContext): IGrantCatalogItemArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы выдачи предмета обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.key !== 'string' || !raw.key.trim()) throw new Error('key предмета обязателен.');
  if (typeof raw.target !== 'string' || !['player', 'location'].includes(raw.target))
    throw new Error('target должен быть player или location.');

  const target = raw.target as 'player' | 'location';

  let playerId: string | undefined;
  let locationId: string | undefined;
  let quantity: number | undefined;

  if (target === 'player') {
    if (typeof raw.playerId !== 'string' || !raw.playerId.trim())
      throw new Error('playerId обязателен для target=player.');
    playerId = raw.playerId.trim();
  } else {
    if (typeof raw.locationId !== 'string' || !raw.locationId.trim())
      throw new Error('locationId обязателен для target=location.');
    locationId = raw.locationId.trim();
  }

  if (raw.quantity !== undefined && raw.quantity !== null) {
    if (typeof raw.quantity !== 'number' || !Number.isInteger(raw.quantity) || raw.quantity < 1)
      throw new Error('quantity должно быть целым числом >= 1.');
    quantity = raw.quantity;
  }

  return { key: raw.key.trim(), target, playerId, locationId, quantity };
};

export const grantCatalogItemTool: ILlmTool = {
  name: 'grant_catalog_item',
  description:
    'Выдаёт предмет из справочника PHB игроку в инвентарь или в текущую локацию на пол. Сначала search_item_catalog для получения key. Складывается, если уже есть предмет с тем же catalogKey. target=player — в инвентарь; target=location — на пол локации. Не создаёт предметы вне справочника. Уникальные предметы кампании не добавляются через этот tool.',
  parameters: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Ключ предмета из справочника (получить через search_item_catalog)',
      },
      target: {
        type: 'string',
        enum: ['player', 'location'],
        description: 'Куда выдать: player (инвентарь игрока) или location (на пол локации)',
      },
      playerId: {
        type: 'string',
        description: 'ID игрока (обязателен для target=player)',
      },
      locationId: {
        type: 'string',
        description: 'ID локации (обязателен для target=location)',
      },
      quantity: {
        type: 'integer',
        description: 'Количество (по умолчанию 1)',
        minimum: 1,
      },
    },
    required: ['key', 'target'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args, ctx);

    if (parsed.target === 'player') {
      const result = await grantCatalogItem({
        playerId: parsed.playerId!,
        key: parsed.key,
        quantity: parsed.quantity,
      });
      return {
        target: 'player',
        playerId: result.playerId,
        item: {
          id: result.id,
          name: result.name,
          kind: result.kind,
          quantity: result.quantity,
          catalogKey: result.catalogKey,
        },
      };
    } else {
      const result = await grantCatalogItemToLocation({
        campaignId: ctx.campaignId,
        locationId: parsed.locationId!,
        key: parsed.key,
        quantity: parsed.quantity,
      });
      return {
        target: 'location',
        locationId: result.locationId,
        item: {
          id: result.id,
          name: result.name,
          kind: result.kind,
          quantity: result.quantity,
          catalogKey: result.catalogKey,
        },
      };
    }
  },
};
