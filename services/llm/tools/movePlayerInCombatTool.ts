import { encounterParticipantRepository, encounterLogRepository, encounterRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository } from '@/data/npc';
import { spendMovement } from '@/services/encounter/actionEconomy';
import type { ILlmTool, IToolContext } from './types';

interface IMovePlayerInCombatArgs {
  playerId: string;
  action: 'approach' | 'retreat' | 'move_away';
  targetParticipantId?: string | null;
  feet?: number | null;
}

const parseArgs = (args: unknown): IMovePlayerInCombatArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы movePlayerInCombat обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('playerId обязателен.');
  if (typeof raw.action !== 'string' || !['approach', 'retreat', 'move_away'].includes(raw.action))
    throw new Error('action должен быть approach, retreat или move_away.');

  let feet: number | null = null;
  if (raw.feet !== undefined && raw.feet !== null) {
    if (typeof raw.feet !== 'number') throw new Error('feet должен быть числом.');
    if (!Number.isInteger(raw.feet)) throw new Error('feet должен быть целым числом.');
    if (raw.feet <= 0) throw new Error('feet должен быть положительным (>0).');
    feet = raw.feet;
  }

  return {
    playerId: raw.playerId.trim(),
    action: raw.action as 'approach' | 'retreat' | 'move_away',
    targetParticipantId: (raw.targetParticipantId as string | null | undefined) ?? null,
    feet,
  };
};

export const movePlayerInCombatTool: ILlmTool = {
  name: 'move_player_in_combat',
  description:
    'Перемещает игрока по линии боя. action=approach (приблизиться к цели, остановиться в 5 футах), action=retreat или move_away (отступить от цели или ближайшего врага). feet - желаемое расстояние (по умолчанию вся скорость). КОД определяет направление и останавливает в 5 футах при approach.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
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
    },
    required: ['playerId', 'action'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.playerId) throw new Error('playerId отсутствует в контексте.');
    if (parsed.playerId !== ctx.playerId) throw new Error('FORBIDDEN: Нельзя двигать другого игрока.');

    const player = await playerRepository.getById(parsed.playerId);
    if (!player) throw new Error('Игрок не найден.');

    if (player.dead) throw new Error('PLAYER_DEAD: Игрок мёртв и не может двигаться.');

    if (player.hpCurrent <= 0) throw new Error('PLAYER_UNCONSCIOUS: Игрок без сознания (0 HP) и не может двигаться.');

    const blockingConditions = ['unconscious', 'paralyzed', 'stunned', 'incapacitated', 'petrified'];
    const hasBlockingCondition = player.conditions.some((c) => blockingConditions.includes(c.toLowerCase()));
    if (hasBlockingCondition) throw new Error('PLAYER_INCAPACITATED: Игрок не может двигаться из-за состояния.');

    const movementBlockingConditions = ['grappled', 'restrained'];
    const hasMovementBlock = player.conditions.some((c) => movementBlockingConditions.includes(c.toLowerCase()));
    if (hasMovementBlock) throw new Error('PLAYER_MOVEMENT_BLOCKED: Игрок не может двигаться (grappled/restrained).');

    if (player.exhaustionLevel >= 6) throw new Error('PLAYER_EXHAUSTED: Игрок истощён до смерти (exhaustion 6).');

    if (player.exhaustionLevel >= 5)
      throw new Error('PLAYER_EXHAUSTED: Скорость игрока = 0 из-за истощения (exhaustion 5+).');

    if (!ctx.encounterId) throw new Error('encounterId отсутствует в контексте.');

    const participants = await encounterParticipantRepository.listByEncounterId(ctx.encounterId);
    const playerParticipant = participants.find((p) => p.playerId === parsed.playerId);
    if (!playerParticipant) throw new Error('Участник игрока не найден в боевой сцене.');

    const encounter = await encounterRepository.getById(ctx.encounterId);
    if (!encounter) throw new Error('Боевая сцена не найдена.');

    const orderedParticipants = [...participants].sort((a, b) => a.order - b.order);
    const currentParticipant = orderedParticipants[encounter.currentTurnIndex];

    if (!currentParticipant || currentParticipant.id !== playerParticipant.id || currentParticipant.isOut) {
      throw new Error('NOT_PLAYER_TURN: Сейчас не ход игрока.');
    }

    const speed = player.speed;
    const positionBefore = playerParticipant.positionFeet;
    const requestedFeet = parsed.feet ?? speed;

    let targetPosition: number;
    let targetName = 'неизвестная цель';

    if (parsed.action === 'approach') {
      if (!parsed.targetParticipantId) throw new Error('targetParticipantId обязателен для approach.');
      const target = participants.find((p) => p.id === parsed.targetParticipantId);
      if (!target) throw new Error('Цель не найдена.');
      targetPosition = target.positionFeet;

      if (target.monsterInstanceId) {
        const monster = await monsterInstanceRepository.getById(target.monsterInstanceId);
        if (monster) targetName = monster.name;
      } else if (target.npcId) {
        const npc = await npcRepository.getById(target.npcId);
        if (npc) targetName = npc.name;
      }

      const distance = Math.abs(targetPosition - positionBefore);
      const maxMoveToStop = Math.max(0, distance - 5);
      const actualMove = Math.min(requestedFeet, maxMoveToStop);

      const direction = targetPosition === positionBefore ? 0 : targetPosition > positionBefore ? 1 : -1;

      const movementResult = await spendMovement(playerParticipant.id, actualMove, speed);
      if (!movementResult.success) {
        return {
          movedFeet: 0,
          positionBefore,
          positionAfter: positionBefore,
          distanceToTarget: distance,
          speed,
          playerName: player.name,
          errorCode: movementResult.errorCode,
          movementLeft: movementResult.movementLeft,
          message: `Превышен лимит движения (осталось ${movementResult.movementLeft} фт из ${speed} фт)`,
        };
      }

      const positionAfter = positionBefore + direction * actualMove;

      await encounterParticipantRepository.update(playerParticipant.id, { positionFeet: positionAfter });

      for (const p of participants) {
        if (p.id === playerParticipant.id) continue;
        const newFeetFromPlayer = Math.abs(p.positionFeet - positionAfter);
        await encounterParticipantRepository.update(p.id, { feetFromPlayer: newFeetFromPlayer });
      }

      if (ctx.encounterId) {
        await encounterLogRepository.create({
          encounterId: ctx.encounterId,
          actorName: player.name,
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
        playerName: player.name,
        targetName,
      };
    } else {
      if (parsed.targetParticipantId) {
        const target = participants.find((p) => p.id === parsed.targetParticipantId);
        if (!target) throw new Error('Цель не найдена.');
        targetPosition = target.positionFeet;
      } else {
        const enemies = participants.filter((p) => p.monsterInstanceId && !p.isOut);
        if (enemies.length === 0) throw new Error('Нет живых врагов для отступления.');
        const closest = enemies.reduce((prev, curr) =>
          Math.abs(curr.positionFeet - positionBefore) < Math.abs(prev.positionFeet - positionBefore) ? curr : prev
        );
        targetPosition = closest.positionFeet;
      }

      let direction: number;
      if (targetPosition === positionBefore) {
        const enemies = participants.filter((p) => p.monsterInstanceId && !p.isOut);
        const centerOfEnemies =
          enemies.length > 0 ? enemies.reduce((sum, e) => sum + e.positionFeet, 0) / enemies.length : positionBefore;
        direction = centerOfEnemies > positionBefore ? -1 : centerOfEnemies < positionBefore ? 1 : -1;
      } else {
        direction = targetPosition > positionBefore ? -1 : 1;
      }
      const actualMove = Math.min(requestedFeet, speed);

      const movementResult = await spendMovement(playerParticipant.id, actualMove, speed);
      if (!movementResult.success) {
        return {
          movedFeet: 0,
          positionBefore,
          positionAfter: positionBefore,
          speed,
          playerName: player.name,
          errorCode: movementResult.errorCode,
          movementLeft: movementResult.movementLeft,
          message: `Превышен лимит движения (осталось ${movementResult.movementLeft} фт из ${speed} фт)`,
        };
      }

      const positionAfter = positionBefore + direction * actualMove;

      await encounterParticipantRepository.update(playerParticipant.id, { positionFeet: positionAfter });

      for (const p of participants) {
        if (p.id === playerParticipant.id) continue;
        const newFeetFromPlayer = Math.abs(p.positionFeet - positionAfter);
        await encounterParticipantRepository.update(p.id, { feetFromPlayer: newFeetFromPlayer });
      }

      const enemies = participants.filter((p) => p.monsterInstanceId && !p.isOut);
      const minDistanceToEnemies =
        enemies.length > 0
          ? Math.min(...enemies.map((enemy) => Math.abs(positionAfter - enemy.positionFeet)))
          : Infinity;

      let fled = false;
      if (minDistanceToEnemies > 120) {
        await encounterParticipantRepository.update(playerParticipant.id, { isOut: true });
        fled = true;
      }

      if (ctx.encounterId) {
        const { checkEncounterEnd } = await import('@/services/encounter/checkEncounterEnd');

        await encounterLogRepository.create({
          encounterId: ctx.encounterId,
          actorName: player.name,
          message: fled
            ? `отступает на ${actualMove} фт (позиция: ${positionBefore} → ${positionAfter}) и сбегает из боя (дистанция >120 фт от всех противников)`
            : `отступает на ${actualMove} фт (позиция: ${positionBefore} → ${positionAfter})`,
          meta: { action: 'retreat', movedFeet: actualMove, positionBefore, positionAfter, speed, fled },
        });

        if (fled) {
          await checkEncounterEnd({ encounterId: ctx.encounterId });
        }
      }

      return {
        movedFeet: actualMove,
        positionBefore,
        positionAfter,
        speed,
        playerName: player.name,
        fled,
      };
    }
  },
};
