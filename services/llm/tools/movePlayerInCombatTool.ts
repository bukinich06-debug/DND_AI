import { encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import type { ILlmTool, IToolContext } from './types';

interface IMovePlayerInCombatArgs {
  playerId: string;
  targetParticipantId: string;
  feet?: number | null;
}

const parseArgs = (args: unknown): IMovePlayerInCombatArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы movePlayerInCombat обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim())
    throw new Error('playerId обязателен.');
  if (typeof raw.targetParticipantId !== 'string' || !raw.targetParticipantId.trim())
    throw new Error('targetParticipantId обязателен.');

  return {
    playerId: raw.playerId.trim(),
    targetParticipantId: raw.targetParticipantId.trim(),
    feet: (raw.feet as number | null | undefined) ?? null,
  };
};

export const movePlayerInCombatTool: ILlmTool = {
  name: 'move_player_in_combat',
  description:
    'Перемещает игрока ближе к цели на указанное количество футов (или на всю доступную скорость). Уменьшает feetFromPlayer выбранного participant. Используй перед рукопашной атакой, если цель слишком далеко. Движение игрока к монстру = уменьшение feetFromPlayer этого монстра.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
      targetParticipantId: {
        type: 'string',
        description: 'ID участника боя — цели движения',
      },
      feet: {
        type: 'number',
        description: 'Количество футов для перемещения (по умолчанию = вся скорость игрока)',
      },
    },
    required: ['playerId', 'targetParticipantId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.playerId) throw new Error('playerId отсутствует в контексте.');
    if (parsed.playerId !== ctx.playerId)
      throw new Error('FORBIDDEN: Нельзя двигать другого игрока.');

    const player = await playerRepository.getById(parsed.playerId);
    if (!player) throw new Error('Игрок не найден.');

    if (player.dead) throw new Error('PLAYER_DEAD: Игрок мёртв и не может двигаться.');

    const blockingConditions = ['unconscious', 'paralyzed', 'stunned', 'incapacitated', 'petrified'];
    const hasBlockingCondition = player.conditions.some((c) => blockingConditions.includes(c.toLowerCase()));
    if (hasBlockingCondition)
      throw new Error('PLAYER_INCAPACITATED: Игрок не может двигаться из-за состояния.');

    const movementBlockingConditions = ['grappled', 'restrained'];
    const hasMovementBlock = player.conditions.some((c) => movementBlockingConditions.includes(c.toLowerCase()));
    if (hasMovementBlock)
      throw new Error('PLAYER_MOVEMENT_BLOCKED: Игрок не может двигаться (grappled/restrained).');

    if (player.exhaustionLevel >= 6)
      throw new Error('PLAYER_EXHAUSTED: Игрок истощён до смерти (exhaustion 6).');

    if (player.exhaustionLevel >= 5)
      throw new Error('PLAYER_EXHAUSTED: Скорость игрока = 0 из-за истощения (exhaustion 5+).');

    const target = await encounterParticipantRepository.getById(parsed.targetParticipantId);
    if (!target) throw new Error('Участник боя не найден.');

    const speed = player.speed;
    const current = target.feetFromPlayer;
    const requestedFeet = parsed.feet ?? speed;

    const maxMove = Math.min(speed, requestedFeet);
    const actualMove = Math.min(maxMove, current);

    const newDistance = Math.max(0, current - actualMove);

    await encounterParticipantRepository.update(target.id, {
      feetFromPlayer: newDistance,
    });

    if (ctx.encounterId) {
      await encounterLogRepository.create({
        encounterId: ctx.encounterId,
        actorName: player.name,
        message: `перемещается на ${actualMove} футов (дистанция до цели: ${current} → ${newDistance} фт)`,
        meta: { movedFeet: actualMove, feetFromPlayerBefore: current, feetFromPlayerAfter: newDistance, speed },
      });
    }

    return {
      movedFeet: actualMove,
      feetFromPlayerBefore: current,
      feetFromPlayerAfter: newDistance,
      speed,
      playerName: player.name,
      targetName: target.monsterInstanceId ? 'монстр' : target.npcId ? 'NPC' : 'игрок',
    };
  },
};
