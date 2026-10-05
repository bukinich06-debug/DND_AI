import { encounterParticipantRepository, encounterRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import type { IEncounterParticipant } from '@/domain/encounter';
import { spendMovement } from '@/services/encounter/actionEconomy';
import type { ILlmTool, IToolContext } from './types';

interface IMoveInCombatArgs {
  action: 'approach' | 'retreat' | 'move_away';
  targetParticipantId?: string | null;
  feet?: number | null;
}

const parseArgs = (args: unknown): IMoveInCombatArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы moveInCombat обязательны.');

  const raw = args as Record<string, unknown>;
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
    action: raw.action as 'approach' | 'retreat' | 'move_away',
    targetParticipantId: (raw.targetParticipantId as string | null | undefined) ?? null,
    feet,
  };
};

const resolveTargetName = async (target: IEncounterParticipant): Promise<string> => {
  if (target.playerId) {
    const player = await playerRepository.getById(target.playerId);
    if (player) return player.name;
  }
  if (target.npcId) {
    const npc = await npcRepository.getById(target.npcId);
    if (npc) return npc.name;
  }
  if (target.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(target.monsterInstanceId);
    if (monster) return monster.name;
  }
  return 'неизвестная цель';
};

export const moveInCombatTool: ILlmTool = {
  name: 'move_in_combat',
  description:
    'Перемещает монстра по линии боя. action=approach (приблизиться к цели, остановиться в 5 футах), action=retreat или move_away (отступить от цели или ближайшего врага). feet - желаемое расстояние (по умолчанию остаток движения). КОД определяет направление и останавливает в 5 футах при approach. monsterInstanceId и encounterId берутся из контекста хода. Журнал боя пишет вызывающий ход, не этот tool.',
  parameters: {
    type: 'object',
    properties: {
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
        description: 'Желаемое расстояние движения (по умолчанию = остаток движения)',
      },
    },
    required: ['action'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.monsterInstanceId) throw new Error('monsterInstanceId отсутствует в контексте.');
    if (!ctx.encounterId) throw new Error('encounterId отсутствует в контексте.');

    const monster = await monsterInstanceRepository.getById(ctx.monsterInstanceId);
    if (!monster) throw new Error('Монстр не найден.');

    const allParticipants = await encounterParticipantRepository.listByEncounterId(ctx.encounterId);

    const participant = allParticipants.find((p) => p.monsterInstanceId === monster.id);
    if (!participant) throw new Error('Участник монстра не найден в боевой сцене.');

    if (participant.isOut) throw new Error('MONSTER_OUT: Монстр выбыл из боя и не может двигаться.');
    if (monster.hpCurrent <= 0) throw new Error('MONSTER_DOWN: Монстр без сознания (0 HP) и не может двигаться.');

    const encounter = await encounterRepository.getById(ctx.encounterId);
    if (!encounter) throw new Error('Боевая сцена не найдена.');

    const orderedParticipants = [...allParticipants].sort((a, b) => a.order - b.order);
    const currentParticipant = orderedParticipants[encounter.currentTurnIndex];
    if (!currentParticipant || currentParticipant.id !== participant.id || currentParticipant.isOut)
      throw new Error('NOT_MONSTER_TURN: Сейчас не ход этого участника.');

    const speed = monster.speed;
    const leftover = Math.max(0, speed - participant.movementUsedFeet);
    const positionBefore = participant.positionFeet;
    const requestedFeet = parsed.feet ?? leftover;

    let targetPosition: number;
    let targetName = 'неизвестная цель';

    if (parsed.action === 'approach') {
      if (!parsed.targetParticipantId) throw new Error('targetParticipantId обязателен для approach.');
      const target = allParticipants.find((p) => p.id === parsed.targetParticipantId);
      if (!target) throw new Error('Цель не найдена.');
      targetPosition = target.positionFeet;
      targetName = await resolveTargetName(target);

      const distance = Math.abs(targetPosition - positionBefore);
      const maxMoveToStop = Math.max(0, distance - 5);
      const actualMove = Math.min(requestedFeet, maxMoveToStop);

      if (actualMove === 0) {
        return {
          movedFeet: 0,
          positionBefore,
          positionAfter: positionBefore,
          distanceToTarget: distance,
          speed,
          monsterName: monster.name,
          targetName,
        };
      }

      const direction = targetPosition === positionBefore ? 0 : targetPosition > positionBefore ? 1 : -1;

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

      const playerParticipant = allParticipants.find((p) => p.playerId);
      const playerPosition = playerParticipant?.positionFeet ?? 0;
      const newFeetFromPlayer = Math.abs(positionAfter - playerPosition);

      await encounterParticipantRepository.update(participant.id, { feetFromPlayer: newFeetFromPlayer });

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
        targetName = await resolveTargetName(target);
      } else {
        const enemies = allParticipants.filter((p) => (p.playerId || p.npcId) && !p.isOut);
        if (enemies.length === 0) throw new Error('Нет живых врагов для отступления.');
        const closest = enemies.reduce((prev, curr) =>
          Math.abs(curr.positionFeet - positionBefore) < Math.abs(prev.positionFeet - positionBefore) ? curr : prev
        );
        targetPosition = closest.positionFeet;
        targetName = await resolveTargetName(closest);
      }

      let direction: number;
      if (targetPosition === positionBefore) {
        const enemies = allParticipants.filter((p) => (p.playerId || p.npcId) && !p.isOut);
        const centerOfEnemies =
          enemies.length > 0 ? enemies.reduce((sum, e) => sum + e.positionFeet, 0) / enemies.length : positionBefore;
        direction = centerOfEnemies > positionBefore ? -1 : centerOfEnemies < positionBefore ? 1 : -1;
      } else {
        direction = targetPosition > positionBefore ? -1 : 1;
      }
      const actualMove = Math.min(requestedFeet, speed);

      if (actualMove === 0) {
        return {
          movedFeet: 0,
          positionBefore,
          positionAfter: positionBefore,
          speed,
          monsterName: monster.name,
          targetName,
          fled: false,
        };
      }

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

      const playerParticipant = allParticipants.find((p) => p.playerId);
      const playerPosition = playerParticipant?.positionFeet ?? 0;
      const newFeetFromPlayer = Math.abs(positionAfter - playerPosition);

      await encounterParticipantRepository.update(participant.id, { feetFromPlayer: newFeetFromPlayer });

      const enemies = allParticipants.filter((p) => (p.playerId || p.npcId) && !p.isOut);
      const minDistanceToEnemies =
        enemies.length > 0
          ? Math.min(...enemies.map((enemy) => Math.abs(positionAfter - enemy.positionFeet)))
          : Infinity;

      let fled = false;
      if (minDistanceToEnemies > 120) {
        await encounterParticipantRepository.update(participant.id, { isOut: true });
        fled = true;
      }

      if (fled) {
        const { checkEncounterEnd } = await import('@/services/encounter/checkEncounterEnd');
        await checkEncounterEnd({ encounterId: ctx.encounterId });
      }

      return {
        movedFeet: actualMove,
        positionBefore,
        positionAfter,
        speed,
        monsterName: monster.name,
        targetName,
        fled,
      };
    }
  },
};
