import { CombatFlag, hasFlag, withFlag } from '@/domain/combat';
import { encounterParticipantRepository, encounterLogRepository, encounterRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { spendAction } from '@/services/encounter/actionEconomy';
import type { ILlmTool, IToolContext } from './types';

interface IUsePlayerDisengageArgs {
  playerId: string;
}

const parseArgs = (args: unknown): IUsePlayerDisengageArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы usePlayerDisengage обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('playerId обязателен.');
  return { playerId: raw.playerId.trim() };
};

export const usePlayerDisengageTool: ILlmTool = {
  name: 'use_player_disengage',
  description:
    'Отход — основное действие. Ставит флаг Отхода на этот ход: выход из досягаемости (5 фт) не провоцирует атаку. После Отхода можно двигаться move_player_in_combat. Реакция врага на провокацию обрабатывается кодом автоматически, этот tool её не заменяет.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
    },
    required: ['playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.playerId) throw new Error('playerId отсутствует в контексте.');
    if (parsed.playerId !== ctx.playerId) throw new Error('FORBIDDEN: Нельзя действовать за другого игрока.');
    if (!ctx.encounterId) throw new Error('encounterId отсутствует в контексте.');

    const player = await playerRepository.getById(parsed.playerId);
    if (!player) throw new Error('Игрок не найден.');
    if (player.dead) throw new Error('PLAYER_DEAD: Игрок мёртв и не может действовать.');
    if (player.hpCurrent <= 0) throw new Error('PLAYER_UNCONSCIOUS: Игрок без сознания (0 HP) и не может действовать.');

    const participants = await encounterParticipantRepository.listByEncounterId(ctx.encounterId);
    const playerParticipant = participants.find((p) => p.playerId === parsed.playerId);
    if (!playerParticipant) throw new Error('Участник игрока не найден в боевой сцене.');

    const encounter = await encounterRepository.getById(ctx.encounterId);
    if (!encounter) throw new Error('Боевая сцена не найдена.');

    const ordered = [...participants].sort((a, b) => a.order - b.order);
    const current = ordered[encounter.currentTurnIndex];
    if (!current || current.id !== playerParticipant.id || current.isOut)
      throw new Error('NOT_PLAYER_TURN: Сейчас не ход игрока.');

    if (hasFlag(player.conditions, CombatFlag.disengaged)) {
      return {
        ok: true,
        already: true,
        kind: 'disengage',
        message: `${player.name} уже в Отходе в этот ход.`,
      };
    }

    const spendResult = await spendAction(playerParticipant.id, 'action');
    if (!spendResult.success) {
      return {
        ok: false,
        errorCode: spendResult.errorCode,
        message: 'Основное действие уже использовано в этом ходу.',
      };
    }

    await playerRepository.update(player.id, {
      conditions: withFlag(player.conditions, CombatFlag.disengaged),
    });

    await encounterLogRepository.create({
      encounterId: ctx.encounterId,
      actorName: player.name,
      message: `${player.name} совершает Отход (основное действие). Выход из досягаемости в этот ход не провоцирует атаку.`,
      meta: { action: 'disengage' },
    });

    return {
      ok: true,
      kind: 'disengage',
      actionUsed: true,
      message: `${player.name} совершает Отход.`,
    };
  },
};
