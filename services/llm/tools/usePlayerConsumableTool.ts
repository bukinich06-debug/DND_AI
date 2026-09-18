import { itemRepository } from '@/data/item';
import { playerRepository } from '@/data/player';
import { encounterLogRepository } from '@/data/encounter';
import { rollDice } from '@/services/dice/roll/rollDice';
import { DiceKind } from '@/domain/shared';
import type { ILlmTool, IToolContext } from './types';

interface IUsePlayerConsumableArgs {
  playerId: string;
  itemId: string;
}

const parseArgs = (args: unknown): IUsePlayerConsumableArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы usePlayerConsumable обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim())
    throw new Error('playerId обязателен.');
  if (typeof raw.itemId !== 'string' || !raw.itemId.trim())
    throw new Error('itemId обязателен.');

  return {
    playerId: raw.playerId.trim(),
    itemId: raw.itemId.trim(),
  };
};

const parseDiceFormula = (formula: string): { dieCount: number; die: DiceKind; bonus: number } => {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) throw new Error(`Некорректная формула лечения: ${formula}`);

  const dieCount = parseInt(match[1], 10);
  const dieValue = parseInt(match[2], 10);
  const bonus = match[3] ? parseInt(match[3], 10) : 0;

  const dieMap: Record<number, DiceKind> = {
    4: DiceKind.d4,
    6: DiceKind.d6,
    8: DiceKind.d8,
    10: DiceKind.d10,
    12: DiceKind.d12,
    20: DiceKind.d20,
  };

  const die = dieMap[dieValue];
  if (!die) throw new Error(`Неподдерживаемый кубик: d${dieValue}`);

  return { dieCount, die, bonus };
};

export const usePlayerConsumableTool: ILlmTool = {
  name: 'use_player_consumable',
  description:
    'Использует расходный предмет (зелье лечения и т.п.) из инвентаря игрока. Автоматически применяет эффект (лечение HP), списывает quantity или удаляет предмет. Пишет в лог боя. Можно использовать один раз за ход (тратит бонусное действие).',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      itemId: {
        type: 'string',
        description: 'ID расходного предмета (зелья) из инвентаря игрока',
      },
    },
    required: ['playerId', 'itemId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.playerId) throw new Error('playerId отсутствует в контексте.');
    if (parsed.playerId !== ctx.playerId)
      throw new Error('FORBIDDEN: Нельзя использовать предметы от имени другого игрока.');

    const player = await playerRepository.getById(parsed.playerId);
    if (!player) throw new Error('Игрок не найден.');

    if (player.dead) throw new Error('PLAYER_DEAD: Игрок мёртв и не может использовать предметы.');

    const blockingConditions = ['unconscious', 'paralyzed', 'stunned', 'incapacitated', 'petrified'];
    const hasBlockingCondition = player.conditions.some((c) => blockingConditions.includes(c.toLowerCase()));
    if (hasBlockingCondition)
      throw new Error('PLAYER_INCAPACITATED: Игрок не может использовать предметы из-за состояния.');

    if (player.exhaustionLevel >= 6)
      throw new Error('PLAYER_EXHAUSTED: Игрок истощён до смерти (exhaustion 6).');

    const item = await itemRepository.getById(parsed.itemId);

    if (!item) throw new Error('Предмет не найден.');
    if (item.playerId !== parsed.playerId) throw new Error('Предмет не принадлежит этому игроку.');
    if (item.kind !== 'consumable')
      throw new Error('Предмет не является расходным (kind должен быть consumable).');
    if (item.quantity < 1) throw new Error('Предмет закончился (quantity < 1).');

    const props = item.properties ?? [];
    const healProp = props.find((p) => p.type === 'heal');

    if (!healProp || healProp.type !== 'heal') {
      return {
        used: false,
        errorCode: 'UNKNOWN_CONSUMABLE_EFFECT',
        message: 'Эффект предмета не распознан (нет heal в properties).',
      };
    }

    const healFormula = healProp.dice;
    const parsed_heal = parseDiceFormula(healFormula);
    const { dieCount, die, bonus } = parsed_heal;

    const rolls: number[] = [];
    for (let i = 0; i < dieCount; i += 1) {
      const roll = await rollDice({
        campaignId: ctx.campaignId,
        die,
        note: `Лечение ${player.name} (${item.name}, кубик ${i + 1})`,
        npcId: null,
        playerId: player.id,
      });
      rolls.push(roll.value);
    }

    const healTotal = rolls.reduce((sum, val) => sum + val, 0) + bonus;
    const oldHp = player.hpCurrent;
    const newHp = Math.min(player.hpMax, oldHp + healTotal);

    await playerRepository.update(player.id, { hpCurrent: newHp });

    if (item.quantity > 1) {
      await itemRepository.update(item.id, { quantity: item.quantity - 1 });
    } else {
      await itemRepository.delete(item.id);
    }

    if (ctx.encounterId) {
      await encounterLogRepository.create({
        encounterId: ctx.encounterId,
        actorName: player.name,
        message: `использовал ${item.name} и восстановил ${healTotal} HP (${oldHp} → ${newHp})`,
        meta: { healRolls: rolls, healBonus: bonus, healTotal, oldHp, newHp },
      });
    }

    return {
      used: true,
      itemName: item.name,
      healFormula,
      healRolls: rolls,
      healBonus: bonus,
      healTotal,
      playerName: player.name,
      oldHp,
      newHp,
      hpMax: player.hpMax,
    };
  },
};
