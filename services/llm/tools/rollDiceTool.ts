import { DiceKind } from '@/domain/shared';
import { rollDice } from '@/services/dice/roll/rollDice';
import type { ILlmTool, IToolContext } from './types';

const DIE_VALUES = Object.values(DiceKind);

interface IRollDiceArgs {
  die: DiceKind;
  note?: string | null;
  playerId?: string | null;
  npcId?: string | null;
}

const isDiceKind = (value: unknown): value is DiceKind =>
  typeof value === 'string' && DIE_VALUES.includes(value as DiceKind);

const parseArgs = (args: unknown): IRollDiceArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы броска кубика обязательны.');

  const raw = args as Record<string, unknown>;
  if (!isDiceKind(raw.die)) throw new Error('Недопустимый тип кубика.');

  return {
    die: raw.die,
    note: (raw.note as string | null | undefined) ?? null,
    playerId: (raw.playerId as string | null | undefined) ?? null,
    npcId: (raw.npcId as string | null | undefined) ?? null,
  };
};

export const rollDiceTool: ILlmTool = {
  name: 'roll_dice',
  description:
    'Бросает один кубик D&D (d4–d100) и сохраняет результат. Используй для проверок характеристик, атак, урона и любых бросков. В note кратко укажи цель броска (например «проверка Силы», «атака длинным мечом»). Передай playerId или npcId, если бросает конкретный персонаж; не передавай оба сразу. Без них — бросок Мастера.',
  parameters: {
    type: 'object',
    properties: {
      die: {
        type: 'string',
        enum: DIE_VALUES,
        description: 'Тип кубика',
      },
      note: {
        type: 'string',
        description: 'Зачем бросок (проверка, атака и т.п.)',
      },
      playerId: {
        type: 'string',
        description: 'ID игрока, если бросает PC',
      },
      npcId: {
        type: 'string',
        description: 'ID NPC, если бросает NPC',
      },
    },
    required: ['die'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const roll = await rollDice({
      campaignId: ctx.campaignId,
      die: parsed.die,
      note: parsed.note,
      playerId: parsed.playerId,
      npcId: parsed.npcId,
    });

    return {
      id: roll.id,
      campaignId: roll.campaignId,
      die: roll.die,
      value: roll.value,
      note: roll.note,
      playerId: roll.playerId,
      npcId: roll.npcId,
      rolledAt: roll.rolledAt.toISOString(),
    };
  },
};
