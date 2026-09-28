import { startCombat } from '@/services/encounter/startCombat';
import type { ILlmTool, IToolContext } from './types';

interface IEnemyInput {
  catalogKey: string;
  count: number;
  feetFromPlayer?: number;
}

interface IAllyInput {
  npcId: string;
  positionFeet?: number;
}

interface IArgs {
  enemies: IEnemyInput[];
  allyNpcs?: IAllyInput[];
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

    let feetFromPlayer: number | undefined;
    if (e.feetFromPlayer !== undefined) {
      if (typeof e.feetFromPlayer !== 'number') throw new Error(`Враг ${index}: feetFromPlayer должен быть числом.`);
      feetFromPlayer = Math.floor(e.feetFromPlayer);
    }

    return {
      catalogKey: e.catalogKey.trim(),
      count: Math.floor(e.count),
      feetFromPlayer,
    };
  });

  let allyNpcs: IAllyInput[] | undefined;
  if (raw.allyNpcs !== undefined) {
    if (!Array.isArray(raw.allyNpcs)) throw new Error('allyNpcs должен быть массивом.');
    allyNpcs = raw.allyNpcs.map((ally, index) => {
      if (!ally || typeof ally !== 'object') throw new Error(`allyNpcs[${index}] должен быть объектом.`);
      const a = ally as Record<string, unknown>;

      if (typeof a.npcId !== 'string' || !a.npcId.trim()) throw new Error(`allyNpcs[${index}]: npcId обязателен.`);

      let positionFeet: number | undefined;
      if (a.positionFeet !== undefined) {
        if (typeof a.positionFeet !== 'number') throw new Error(`allyNpcs[${index}]: positionFeet должен быть числом.`);
        positionFeet = Math.floor(a.positionFeet);
      }

      return {
        npcId: a.npcId.trim(),
        positionFeet,
      };
    });
  }

  let locationId: string | undefined;
  if (raw.locationId !== undefined) {
    if (typeof raw.locationId !== 'string' || !raw.locationId.trim())
      throw new Error('locationId должен быть строкой.');
    locationId = raw.locationId.trim();
  }

  return { enemies, allyNpcs, locationId };
};

export const startCombatTool: ILlmTool = {
  name: 'start_combat',
  description:
    'Начинает боевую сцену с указанными врагами из справочника монстров. Игрок ВСЕГДА на позиции 0 на линии боя. Мастер расставляет врагов и союзников по линии относительно игрока: положительные позиции (перед игроком), отрицательные (позади игрока). Примеры: гоблины на +30, лучник-союзник на -5, засада сзади на -20. Позиция задаётся целым числом футов. Если не указано — дефолт: ближний бой 5-15 ft, средняя дистанция 30-60 ft, дальняя 100+ ft.',
  parameters: {
    type: 'object',
    properties: {
      enemies: {
        type: 'array',
        description:
          'Массив врагов из справочника. Каждый элемент: { catalogKey: "ключ_монстра", count: число_экземпляров, feetFromPlayer?: позиция_на_линии }. Позиция — целое число футов на линии относительно основного игрока (на позиции 0). Положительные значения = перед игроком, отрицательные = позади. Мастер расставляет по описанию сцены.',
        items: {
          type: 'object',
          properties: {
            catalogKey: {
              type: 'string',
              description: 'Ключ монстра в справочнике (например "goblin", "orc", "wolf", "skeleton", "bandit").',
            },
            count: {
              type: 'number',
              description: 'Количество экземпляров этого монстра (>= 1).',
            },
            feetFromPlayer: {
              type: 'number',
              description:
                'Позиция на линии боя в футах (целое число, может быть отрицательным). Основной игрок всегда на 0. Примеры: гоблины на +30 (перед игроком), засада сзади на -20 (позади игрока). Если не указано — дефолт +30.',
            },
          },
          required: ['catalogKey', 'count'],
        },
      },
      allyNpcs: {
        type: 'array',
        description:
          'Массив союзных НПС, которые будут участвовать в бою на стороне игрока. Каждый элемент: { npcId: "id_npc", positionFeet?: позиция_на_линии }. Позиция задаётся относительно игрока (на 0). Если не указана — дефолт -5, -10, -15... (позади игрока).',
        items: {
          type: 'object',
          properties: {
            npcId: {
              type: 'string',
              description: 'ID союзного НПС',
            },
            positionFeet: {
              type: 'number',
              description:
                'Позиция союзника на линии боя в футах (целое число, может быть отрицательным). Например: лучник на -5 (позади игрока), воин на +5 (перед игроком). Если не указано — автоматически -5, -10, -15...',
            },
          },
          required: ['npcId'],
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
      allyNpcs: parsed.allyNpcs,
      locationId: parsed.locationId,
    });
  },
};
