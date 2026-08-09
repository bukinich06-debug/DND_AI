import { Condition } from '@/domain/player';
import { addPlayerCondition } from '@/services/player/conditions/addPlayerCondition';
import type { ILlmTool, IToolContext } from './types';

const CONDITION_VALUES = Object.values(Condition);

interface IAddPlayerConditionArgs {
  playerId: string;
  condition: string;
  exhaustionLevel?: number | null;
}

const parseArgs = (args: unknown): IAddPlayerConditionArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы наложения состояния обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');
  if (typeof raw.condition !== 'string' || !raw.condition.trim()) throw new Error('состояние обязательно.');

  let exhaustionLevel: number | null | undefined;
  if (raw.exhaustionLevel !== undefined && raw.exhaustionLevel !== null) {
    if (typeof raw.exhaustionLevel !== 'number' || !Number.isInteger(raw.exhaustionLevel))
      throw new Error('exhaustionLevel должен быть целым числом.');
    exhaustionLevel = raw.exhaustionLevel;
  }

  return {
    playerId: raw.playerId.trim(),
    condition: raw.condition.trim(),
    exhaustionLevel,
  };
};

export const addPlayerConditionTool: ILlmTool = {
  name: 'add_player_condition',
  description:
    'Накладывает состояние PHB 2024 на игрока (blinded, unconscious, poisoned…). Для «сна» передай unconscious или «сон». Для exhaustion без exhaustionLevel — +1 уровень; с exhaustionLevel — установить уровень (0–6). После наложения учитывай rules при действиях игрока.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      condition: {
        type: 'string',
        description: `Ключ или имя состояния (${CONDITION_VALUES.join(', ')}; сон → unconscious)`,
      },
      exhaustionLevel: {
        type: 'integer',
        description: 'Только для exhaustion: установить уровень 0–6 (иначе +1)',
      },
    },
    required: ['playerId', 'condition'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const result = await addPlayerCondition({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      condition: parsed.condition,
      exhaustionLevel: parsed.exhaustionLevel,
    });

    return {
      playerId: result.playerId,
      conditions: result.conditions,
      exhaustionLevel: result.exhaustionLevel,
      rules: result.rules,
    };
  },
};
