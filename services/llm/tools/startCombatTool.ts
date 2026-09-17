import { startCombat } from '@/services/encounter/startCombat';
import type { ILlmTool, IToolContext } from './types';

interface IEnemyInput {
  catalogKey: string;
  count: number;
}

interface IArgs {
  enemies: IEnemyInput[];
  allyNpcIds?: string[];
  locationId?: string;
}

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы начала боя обязательны.');

  const raw = args as Record<string, unknown>;

  if (!Array.isArray(raw.enemies)) throw new Error('Список врагов обязателен.');
  if (raw.enemies.length === 0) throw new Error('Список врагов не может быть пустым.');

  const enemies: IEnemyInput[] = raw.enemies.map((enemy, index) => {
    if (!enemy || typeof enemy !== 'object') throw new Error(`Враг ${index} должен быть объектом.`);
    const e = enemy as Record<string, unknown>;

    if (typeof e.catalogKey !== 'string' || !e.catalogKey.trim())
      throw new Error(`Враг ${index}: catalogKey обязателен.`);
    if (typeof e.count !== 'number' || e.count < 1) throw new Error(`Враг ${index}: count должен быть >= 1.`);

    return {
      catalogKey: e.catalogKey.trim(),
      count: Math.floor(e.count),
    };
  });

  let allyNpcIds: string[] | undefined;
  if (raw.allyNpcIds !== undefined) {
    if (!Array.isArray(raw.allyNpcIds)) throw new Error('allyNpcIds должен быть массивом.');
    allyNpcIds = raw.allyNpcIds.map((id, index) => {
      if (typeof id !== 'string' || !id.trim()) throw new Error(`allyNpcIds[${index}] должен быть строкой.`);
      return id.trim();
    });
  }

  let locationId: string | undefined;
  if (raw.locationId !== undefined) {
    if (typeof raw.locationId !== 'string' || !raw.locationId.trim())
      throw new Error('locationId должен быть строкой.');
    locationId = raw.locationId.trim();
  }

  return { enemies, allyNpcIds, locationId };
};

export const startCombatTool: ILlmTool = {
  name: 'start_combat',
  description:
    'Начинает боевую сцену с указанными врагами из справочника монстров. Автоматически бросает инициативу для всех участников (игрока, союзных НПС и врагов), создаёт экземпляры монстров, сортирует по инициативе. Используй это, когда мастер описывает начало боя.',
  parameters: {
    type: 'object',
    properties: {
      enemies: {
        type: 'array',
        description:
          'Массив врагов из справочника. Каждый элемент: { catalogKey: "ключ_монстра", count: число_экземпляров }.',
        items: {
          type: 'object',
          properties: {
            catalogKey: {
              type: 'string',
              description:
                'Ключ монстра в справочнике (например "goblin", "orc", "wolf", "skeleton", "bandit").',
            },
            count: {
              type: 'number',
              description: 'Количество экземпляров этого монстра (>= 1).',
            },
          },
          required: ['catalogKey', 'count'],
        },
      },
      allyNpcIds: {
        type: 'array',
        description:
          'Массив ID союзных НПС, которые будут участвовать в бою на стороне игрока (опционально).',
        items: {
          type: 'string',
        },
      },
      locationId: {
        type: 'string',
        description: 'ID локации, где происходит бой. Если не указано — используется текущая локация игрока.',
      },
    },
    required: ['enemies'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    if (!ctx.playerId) throw new Error('ID игрока отсутствует в контексте.');
    return startCombat({
      campaignId: ctx.campaignId,
      playerId: ctx.playerId,
      enemies: parsed.enemies,
      allyNpcIds: parsed.allyNpcIds,
      locationId: parsed.locationId,
    });
  },
};
