import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import type { ILlmTool, IToolContext } from './types';

interface IMoveInCombatArgs {
  monsterInstanceId: string;
  feet?: number | null;
  encounterId?: string | null;
}

const parseArgs = (args: unknown): IMoveInCombatArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы moveInCombat обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.monsterInstanceId !== 'string' || !raw.monsterInstanceId.trim())
    throw new Error('monsterInstanceId обязателен.');

  return {
    monsterInstanceId: raw.monsterInstanceId.trim(),
    feet: (raw.feet as number | null | undefined) ?? null,
    encounterId: (raw.encounterId as string | null | undefined) ?? null,
  };
};

export const moveInCombatTool: ILlmTool = {
  name: 'move_in_combat',
  description:
    'Перемещает монстра ближе к игроку на указанное количество футов (или на всю доступную скорость). Уменьшает feetFromPlayer участника. Используй перед рукопашной атакой, если цель слишком далеко.',
  parameters: {
    type: 'object',
    properties: {
      monsterInstanceId: {
        type: 'string',
        description: 'ID экземпляра монстра',
      },
      feet: {
        type: 'number',
        description: 'Количество футов для перемещения (по умолчанию = вся скорость монстра)',
      },
      encounterId: {
        type: 'string',
        description: 'ID боевой сцены (опционально)',
      },
    },
    required: ['monsterInstanceId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const monster = await monsterInstanceRepository.getById(parsed.monsterInstanceId);
    if (!monster) throw new Error('Монстр не найден.');

    const allParticipants = parsed.encounterId
      ? await encounterParticipantRepository.listByEncounterId(parsed.encounterId)
      : [];

    let participant = allParticipants.find((p) => p.monsterInstanceId === monster.id);

    if (!participant) {
      const allEncounterParticipants = await encounterParticipantRepository.listByEncounterId('');
      for (const ep of allEncounterParticipants) {
        if (ep.monsterInstanceId === monster.id) {
          participant = ep;
          break;
        }
      }
    }

    if (!participant) throw new Error('Участник монстра не найден в боевой сцене.');

    const speed = monster.speed;
    const current = participant.feetFromPlayer;
    const requestedFeet = parsed.feet ?? speed;

    const maxMove = Math.min(speed, requestedFeet);
    const actualMove = Math.min(maxMove, current);

    const newDistance = Math.max(0, current - actualMove);

    await encounterParticipantRepository.update(participant.id, {
      feetFromPlayer: newDistance,
    });

    return {
      movedFeet: actualMove,
      feetFromPlayerBefore: current,
      feetFromPlayerAfter: newDistance,
      speed,
      monsterName: monster.name,
    };
  },
};
