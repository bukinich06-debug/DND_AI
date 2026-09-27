import { encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { playerRepository } from '@/data/player';
import { spendMovement } from '@/services/encounter/actionEconomy';
import type { ILlmTool, IToolContext } from './types';

interface IMoveInCombatArgs {
  monsterInstanceId: string;
  action: 'approach' | 'retreat' | 'move_away';
  targetParticipantId?: string | null;
  feet?: number | null;
  encounterId?: string | null;
}

const parseArgs = (args: unknown): IMoveInCombatArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы moveInCombat обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.monsterInstanceId !== 'string' || !raw.monsterInstanceId.trim())
    throw new Error('monsterInstanceId обязателен.');
  if (typeof raw.action !== 'string' || !['approach', 'retreat', 'move_away'].includes(raw.action))
    throw new Error('action должен быть approach, retreat или move_away.');

  return {
    monsterInstanceId: raw.monsterInstanceId.trim(),
    action: raw.action as 'approach' | 'retreat' | 'move_away',
    targetParticipantId: (raw.targetParticipantId as string | null | undefined) ?? null,
    feet: (raw.feet as number | null | undefined) ?? null,
    encounterId: (raw.encounterId as string | null | undefined) ?? null,
  };
};

export const moveInCombatTool: ILlmTool = {
  name: 'move_in_combat',
  description:
    'Перемещает монстра по линии боя. action=approach (приблизиться к цели, остановиться в 5 футах), action=retreat или move_away (отступить от цели или ближайшего врага). feet - желаемое расстояние (по умолчанию вся скорость). КОД определяет направление и останавливает в 5 футах при approach.',
  parameters: {
    type: 'object',
    properties: {
      monsterInstanceId: {
        type: 'string',
        description: 'ID экземпляра монстра',
      },
      action: {
        type: 'string',
        enum: ['approach', 'retreat', 'move_away'],
        description: 'approach - к цели (остановка в 5 фт), retreat/move_away - от цели/врагов',
      },
      targetParticipantId: {
        type: 'string',
        description: 'ID цели для approach или retreat. Если не указан при retreat - от ближайшего врага',
      },
      feet: {
        type: 'number',
        description: 'Желаемое расстояние движения (по умолчанию = вся доступная скорость)',
      },
      encounterId: {
        type: 'string',
        description: 'ID боевой сцены (опционально)',
      },
    },
    required: ['monsterInstanceId', 'action'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const monster = await monsterInstanceRepository.getById(parsed.monsterInstanceId);
    if (!monster) throw new Error('Монстр не найден.');

    const allParticipants = parsed.encounterId
      ? await encounterParticipantRepository.listByEncounterId(parsed.encounterId)
      : ctx.encounterId
        ? await encounterParticipantRepository.listByEncounterId(ctx.encounterId)
        : [];

    const participant = allParticipants.find((p) => p.monsterInstanceId === monster.id);
    if (!participant) throw new Error('Участник монстра не найден в боевой сцене.');

    const speed = monster.speed;
    const positionBefore = participant.positionFeet;
    const requestedFeet = parsed.feet ?? speed;

    let targetPosition: number;
    let targetName = 'неизвестная цель';

    if (parsed.action === 'approach') {
      if (!parsed.targetParticipantId) throw new Error('targetParticipantId обязателен для approach.');
      const target = allParticipants.find((p) => p.id === parsed.targetParticipantId);
      if (!target) throw new Error('Цель не найдена.');
      targetPosition = target.positionFeet;

      if (target.playerId) {
        const player = await playerRepository.getById(target.playerId);
        if (player) targetName = player.name;
      }

      const direction = targetPosition > positionBefore ? 1 : -1;
      const distance = Math.abs(targetPosition - positionBefore);
      const maxMoveToStop = Math.max(0, distance - 5);
      const actualMove = Math.min(requestedFeet, maxMoveToStop);

      const movementResult = await spendMovement(participant.id, actualMove, speed);
      if (!movementResult.success) {
        return {
          movedFeet: 0,
          positionBefore,
          positionAfter: positionBefore,
          distanceToTarget: distance,
          speed,
          monsterName: monster.name,
          errorCode: movementResult.errorCode,
          movementLeft: movementResult.movementLeft,
          message: `Превышен лимит движения (осталось ${movementResult.movementLeft} фт из ${speed} фт)`,
        };
      }

      const positionAfter = positionBefore + direction * actualMove;

      await encounterParticipantRepository.update(participant.id, { positionFeet: positionAfter });

      const playerPositions = allParticipants.filter((p) => p.playerId).map((p) => p.positionFeet);
      const newFeetFromPlayer =
        playerPositions.length > 0 ? Math.min(...playerPositions.map((pos) => Math.abs(positionAfter - pos))) : 0;

      await encounterParticipantRepository.update(participant.id, { feetFromPlayer: newFeetFromPlayer });

      if (ctx.encounterId) {
        await encounterLogRepository.create({
          encounterId: ctx.encounterId,
          actorName: monster.name,
          message: `движется к ${targetName} на ${actualMove} фт (позиция: ${positionBefore} → ${positionAfter}, дистанция до цели: ${distance} → ${Math.abs(positionAfter - targetPosition)} фт)`,
          meta: {
            action: 'approach',
            movedFeet: actualMove,
            positionBefore,
            positionAfter,
            distanceToTarget: Math.abs(positionAfter - targetPosition),
            speed,
          },
        });
      }

      return {
        movedFeet: actualMove,
        positionBefore,
        positionAfter,
        distanceToTarget: Math.abs(positionAfter - targetPosition),
        speed,
        monsterName: monster.name,
        targetName,
      };
    } else {
      if (parsed.targetParticipantId) {
        const target = allParticipants.find((p) => p.id === parsed.targetParticipantId);
        if (!target) throw new Error('Цель не найдена.');
        targetPosition = target.positionFeet;
      } else {
        const enemies = allParticipants.filter((p) => p.playerId || p.npcId);
        if (enemies.length === 0) throw new Error('Нет врагов для отступления.');
        const closest = enemies.reduce((prev, curr) =>
          Math.abs(curr.positionFeet - positionBefore) < Math.abs(prev.positionFeet - positionBefore) ? curr : prev
        );
        targetPosition = closest.positionFeet;
      }

      const direction = targetPosition > positionBefore ? -1 : 1;
      const actualMove = Math.min(requestedFeet, speed);

      const movementResult = await spendMovement(participant.id, actualMove, speed);
      if (!movementResult.success) {
        return {
          movedFeet: 0,
          positionBefore,
          positionAfter: positionBefore,
          speed,
          monsterName: monster.name,
          errorCode: movementResult.errorCode,
          movementLeft: movementResult.movementLeft,
          message: `Превышен лимит движения (осталось ${movementResult.movementLeft} фт из ${speed} фт)`,
        };
      }

      const positionAfter = positionBefore + direction * actualMove;

      await encounterParticipantRepository.update(participant.id, { positionFeet: positionAfter });

      const playerPositions = allParticipants.filter((p) => p.playerId).map((p) => p.positionFeet);
      const newFeetFromPlayer =
        playerPositions.length > 0 ? Math.min(...playerPositions.map((pos) => Math.abs(positionAfter - pos))) : 0;

      await encounterParticipantRepository.update(participant.id, { feetFromPlayer: newFeetFromPlayer });

      if (ctx.encounterId) {
        await encounterLogRepository.create({
          encounterId: ctx.encounterId,
          actorName: monster.name,
          message: `отступает на ${actualMove} фт (позиция: ${positionBefore} → ${positionAfter})`,
          meta: { action: 'retreat', movedFeet: actualMove, positionBefore, positionAfter, speed },
        });
      }

      return {
        movedFeet: actualMove,
        positionBefore,
        positionAfter,
        speed,
        monsterName: monster.name,
      };
    }
  },
};
