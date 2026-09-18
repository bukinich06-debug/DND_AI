import { encounterParticipantRepository } from '@/data/encounter';
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
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const player = await playerRepository.getById(parsed.playerId);
    if (!player) throw new Error('Игрок не найден.');

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
