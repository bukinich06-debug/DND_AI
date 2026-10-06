'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { runMonsterCombatTurn } from '@/services/llm/monster/runMonsterCombatTurn';
import { looksLikeAttack } from '@/services/llm/monster/parseMonsterReply';
import { getActiveEncounter } from './getActiveEncounter';
import { resetActionEconomy } from './actionEconomy';
import { checkEncounterEnd } from './checkEncounterEnd';
import { makeDeathSave } from '@/services/player/deathSaves/makeDeathSave';
import { formatStrikeMessage } from '@/services/encounter/helpers/formatStrikeMessage';
import type { IStrikeResult } from '@/services/encounter/helpers/strikeTypes';

interface IAdvanceCombatTurnInput {
  campaignId: string;
  playerId?: string;
  playerEndedTurn?: boolean;
}

interface ILogEntry {
  actorName: string | null;
  message: string;
  meta?: unknown;
}

interface IToolCallLike {
  name: string;
  args: unknown;
  ok?: boolean;
  result?: unknown;
  error?: string;
}

const hasErrorCode = (result: unknown): boolean =>
  typeof result === 'object' &&
  result !== null &&
  'errorCode' in result &&
  Boolean((result as { errorCode?: unknown }).errorCode);

const formatMonsterErrorNote = (result: unknown, fallback?: string): string => {
  if (typeof result === 'object' && result !== null) {
    const res = result as { errorCode?: string; targetName?: string };
    const target = res.targetName ? ` до ${res.targetName}` : '';
    if (res.errorCode === 'OUT_OF_REACH') return `не дотянулся${target}`;
    if (res.errorCode === 'TARGET_DOWN') return 'цель без сознания, атака невозможна';
    if (res.errorCode === 'ALLIED_TARGET') return 'нельзя атаковать союзника';
    if (res.errorCode === 'INVALID_TARGET') return 'нельзя атаковать эту цель';
    if (res.errorCode === 'ACTION_ALREADY_USED') return 'действие уже использовано';
    if (res.errorCode === 'BONUS_ACTION_ALREADY_USED') return 'бонусное действие уже использовано';
    if (res.errorCode === 'TRAIT_UNAVAILABLE') return 'нет такой черты';
    if (res.errorCode === 'ALREADY_IN_REACH') return 'уже вплотную, Агрессивный не нужен';
    if (res.errorCode === 'TARGET_REQUIRED') return 'нужна цель для Агрессивного';
    if (res.errorCode === 'UNKNOWN_ACTION') return 'действие невозможно';
    if (res.errorCode === 'TARGET_OUT') return 'цель уже выбыла из боя';
    if (res.errorCode === 'MOVEMENT_EXCEEDED') return 'не может двигаться дальше';
    if (res.errorCode) return 'действие невозможно';
  }
  return fallback || 'действие невозможно';
};

export interface IAdvanceCombatTurnResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  encounter: Awaited<ReturnType<typeof getActiveEncounter>>['encounter'];
  newLogEntries: ILogEntry[];
  encounterEnded?: boolean;
  encounterResult?: {
    victory: boolean;
    outcome: 'victory' | 'captured' | 'defeat' | 'fled';
    defeated: string[];
    survivors: string[];
    defeatedMonsters: Array<{ name: string; catalogKey: string }>;
    capturedBy: string[];
  };
}

export const advanceCombatTurn = async (input: IAdvanceCombatTurnInput): Promise<IAdvanceCombatTurnResult> => {
  const encounter = await encounterRepository.getActiveByCampaignId(input.campaignId);

  if (!encounter) {
    return {
      success: false,
      error: 'Активная боевая сцена не найдена.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const participants = await encounterParticipantRepository.listByEncounterId(encounter.id);

  if (participants.length === 0) {
    return {
      success: false,
      error: 'Нет участников боя.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const orderedParticipants = [...participants].sort((a, b) => a.order - b.order);

  const activeParticipants = orderedParticipants.filter((p) => !p.isOut);

  if (activeParticipants.length === 0) {
    return {
      success: false,
      error: 'Все участники выведены из боя.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const currentParticipant = orderedParticipants[encounter.currentTurnIndex];

  if (!currentParticipant) {
    return {
      success: false,
      error: 'Текущий участник не найден.',
      encounter: null,
      newLogEntries: [],
    };
  }

  if (currentParticipant.isOut && !currentParticipant.monsterInstanceId) {
    return {
      success: false,
      error: 'Текущий участник выведен из боя.',
      encounter: null,
      newLogEntries: [],
    };
  }

  const newLogEntries: ILogEntry[] = [];

  if (currentParticipant.playerId) {
    const player = await playerRepository.getById(currentParticipant.playerId);
    if (!player) throw new Error('Игрок не найден.');

    if (!input.playerEndedTurn) {
      const playerCanAct = player.hpCurrent > 0 && !player.dead && !player.isStable;
      if (playerCanAct) {
        return {
          success: false,
          error: 'Нельзя продвинуть ход во время хода игрока. Игрок должен совершить действия или явно завершить ход.',
          errorCode: 'PLAYER_TURN_ACTIVE',
          encounter: null,
          newLogEntries: [],
        };
      }
    }

    if (player.dead && !currentParticipant.isOut) {
      await encounterParticipantRepository.update(currentParticipant.id, { isOut: true });
    }

    if (player.hpCurrent === 0 && !player.dead && !player.isStable) {
      const deathSaveResult = await makeDeathSave({
        playerId: player.id,
        campaignId: input.campaignId,
      });

      let message = '';
      if (deathSaveResult.isRevived) {
        message = `${player.name} бросает спасбросок от смерти: натуральная 20! Игрок восстаёт с 1 HP.`;
      } else if (deathSaveResult.isDead) {
        message = `${player.name} бросает спасбросок от смерти: ${deathSaveResult.roll}. ${deathSaveResult.roll === 1 ? 'Два провала!' : 'Провал.'} Спасброски: ${deathSaveResult.deathSaveSuccess} успехов, ${deathSaveResult.deathSaveFail} провалов. ИГРОК МЁРТВ.`;
      } else if (deathSaveResult.isStable) {
        message = `${player.name} бросает спасбросок от смерти: ${deathSaveResult.roll}. ${deathSaveResult.success ? 'Успех!' : 'Провал.'} Спасброски: ${deathSaveResult.deathSaveSuccess} успехов, ${deathSaveResult.deathSaveFail} провалов. Игрок стабилен.`;
      } else {
        message = `${player.name} бросает спасбросок от смерти: ${deathSaveResult.roll}. ${deathSaveResult.success ? 'Успех!' : 'Провал.'} Спасброски: ${deathSaveResult.deathSaveSuccess} успехов, ${deathSaveResult.deathSaveFail} провалов.`;
      }

      const logEntry = {
        actorName: player.name,
        message,
        meta: { deathSaveResult },
      };
      await encounterLogRepository.create({
        encounterId: encounter.id,
        ...logEntry,
      });
      newLogEntries.push(logEntry);

      if (deathSaveResult.isDead) {
        await encounterParticipantRepository.update(currentParticipant.id, { isOut: true });
      }

      if (deathSaveResult.isRevived) {
        const revivedEncounter = await getActiveEncounter({
          campaignId: input.campaignId,
          playerId: input.playerId,
        });

        return {
          success: true,
          encounter: revivedEncounter.encounter,
          newLogEntries,
          encounterEnded: false,
        };
      }
    } else if (player.hpCurrent === 0 && player.isStable) {
      const stableEntry = {
        actorName: player.name,
        message: `${player.name} стабилен, но без сознания`,
        meta: { stable: true },
      };
      await encounterLogRepository.create({
        encounterId: encounter.id,
        ...stableEntry,
      });
      newLogEntries.push(stableEntry);
    }
  } else if (currentParticipant.monsterInstanceId) {
    const monsterInstance = await monsterInstanceRepository.getById(currentParticipant.monsterInstanceId);
    const actorName = monsterInstance?.name ?? 'Монстр';
    const monsterCannotAct = currentParticipant.isOut || !monsterInstance || monsterInstance.hpCurrent <= 0;

    if (monsterCannotAct) {
      if (!currentParticipant.isOut)
        await encounterParticipantRepository.update(currentParticipant.id, { isOut: true });
    } else {
      try {
        const monsterResult = await runMonsterCombatTurn({
          campaignId: input.campaignId,
          encounterId: encounter.id,
          monsterInstanceId: currentParticipant.monsterInstanceId,
        });

        const moveResults = monsterResult.toolCalls.filter((tc) => tc.name === 'move_in_combat' && tc.result);
        const bonusResults = monsterResult.toolCalls.filter((tc) => tc.name === 'use_monster_bonus' && tc.result);
        const attackResults = monsterResult.toolCalls.filter(
          (tc) =>
            tc.name === 'resolve_monster_attack' &&
            tc.result &&
            typeof tc.result === 'object' &&
            tc.result !== null &&
            !hasErrorCode(tc.result)
        );

        const messages: string[] = [];
        const events: unknown[] = [];
        const errorNotes: string[] = [];
        let attackResultForMeta: Record<string, unknown> | null = null;
        let hasAttackRoll = false;

        for (const move of moveResults) {
          if (typeof move.result === 'object' && move.result !== null) {
            const res = move.result as {
              movedFeet?: number;
              positionBefore?: number;
              positionAfter?: number;
              distanceToTarget?: number;
              monsterName?: string;
              fled?: boolean;
              errorCode?: string;
              interruptedByOpportunity?: boolean;
              opportunityNotes?: string[];
            };

            if (hasErrorCode(move.result)) {
              errorNotes.push(formatMonsterErrorNote(move.result));
              continue;
            }

            if (res.interruptedByOpportunity && res.opportunityNotes && res.opportunityNotes.length > 0) {
              messages.push(
                `${res.monsterName || actorName} не смог отойти — провокация остановила его; ${res.opportunityNotes.join('; ')}`
              );
              events.push(move.result);
              continue;
            }

            if (res.movedFeet && res.movedFeet > 0) {
              const action =
                move.args && typeof move.args === 'object' && 'action' in move.args
                  ? (move.args as { action?: string }).action
                  : 'движется';
              const actionText =
                action === 'approach'
                  ? 'приближается'
                  : action === 'retreat' || action === 'move_away'
                    ? 'отступает'
                    : 'движется';

              const fledText = res.fled ? ' и сбегает из боя' : '';
              const oaText =
                res.opportunityNotes && res.opportunityNotes.length > 0 ? `; ${res.opportunityNotes.join('; ')}` : '';
              const moveMessage = `${res.monsterName || actorName} ${actionText} на ${res.movedFeet} фт (позиция: ${res.positionBefore} → ${res.positionAfter}${res.distanceToTarget !== undefined ? `, дистанция до цели: ${res.distanceToTarget} фт` : ''})${fledText}${oaText}`;
              messages.push(moveMessage);
              events.push(move.result);
            } else if (res.fled) {
              messages.push(`${res.monsterName || actorName} сбегает из боя`);
              events.push(move.result);
            } else if (res.opportunityNotes && res.opportunityNotes.length > 0) {
              messages.push(res.opportunityNotes.join('; '));
              events.push(move.result);
            }
          }
        }

        for (const bonus of bonusResults) {
          if (typeof bonus.result === 'object' && bonus.result !== null) {
            const res = bonus.result as {
              ok?: boolean;
              kind?: string;
              message?: string;
              errorCode?: string;
              movedFeet?: number;
              positionBefore?: number;
              positionAfter?: number;
              distanceToTarget?: number;
              hidden?: boolean;
            };

            if (hasErrorCode(bonus.result) && !res.message) {
              errorNotes.push(formatMonsterErrorNote(bonus.result));
              continue;
            }

            if (res.message) {
              messages.push(res.message);
              events.push(bonus.result);
            }
          }
        }

        for (const attack of attackResults) {
          if (typeof attack.result === 'object' && attack.result !== null) {
            const res = attack.result as {
              multiattack?: boolean;
              strikes?: IStrikeResult[];
              hit?: boolean;
              attackRoll?: number;
            };

            const strikes =
              res.strikes && res.strikes.length > 0
                ? res.strikes
                : res.attackRoll !== undefined
                  ? [res as IStrikeResult]
                  : [];

            for (const strike of strikes) {
              if (strike.hit === undefined && strike.attackRoll === undefined) continue;
              messages.push(formatStrikeMessage(strike));
              if (strike.attackRoll !== undefined) hasAttackRoll = true;
            }

            if (strikes.length > 0) {
              events.push(attack.result);
              attackResultForMeta = attack.result as Record<string, unknown>;
            }
          }
        }

        for (const tc of monsterResult.toolCalls as IToolCallLike[]) {
          if (tc.name === 'use_monster_bonus') {
            if (!tc.ok) errorNotes.push(formatMonsterErrorNote(tc.result, tc.error || 'действие невозможно'));
            continue;
          }
          if (tc.name !== 'resolve_monster_attack' && tc.name !== 'move_in_combat') continue;
          if (tc.ok && hasErrorCode(tc.result)) {
            if (tc.name === 'move_in_combat') continue;
            errorNotes.push(formatMonsterErrorNote(tc.result));
          } else if (!tc.ok) {
            errorNotes.push(formatMonsterErrorNote(tc.result, tc.error || 'действие невозможно'));
          }
        }

        const say = monsterResult.say.trim();
        const sayIsRussian = /[а-яё]/i.test(say);
        const sayIsAttack = looksLikeAttack(say);
        const sayPrefix = say && sayIsRussian && (!sayIsAttack || hasAttackRoll) ? `«${say}» — ` : '';

        if (messages.length > 0) {
          const combinedEntry = {
            actorName,
            message: `${sayPrefix}${messages.join('; ')}`,
            meta: {
              say: monsterResult.say,
              events,
              ...(attackResultForMeta || {}),
            },
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...combinedEntry,
          });
          newLogEntries.push(combinedEntry);
        } else if (errorNotes.length > 0) {
          const errorEntry = {
            actorName,
            message: errorNotes.join('; '),
            meta: { errorCodes: true, say: monsterResult.say },
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...errorEntry,
          });
          newLogEntries.push(errorEntry);
        } else if (say && sayIsRussian && !sayIsAttack) {
          const sayEntry = {
            actorName,
            message: `«${say}»`,
            meta: { say },
          };
          await encounterLogRepository.create({
            encounterId: encounter.id,
            ...sayEntry,
          });
          newLogEntries.push(sayEntry);
        }
      } catch (monsterError) {
        const errorEntry = {
          actorName,
          message: `${actorName} медлит (ошибка хода монстра).`,
          meta: { error: monsterError instanceof Error ? monsterError.message : String(monsterError) },
        };
        await encounterLogRepository.create({
          encounterId: encounter.id,
          ...errorEntry,
        });
        newLogEntries.push(errorEntry);
      }
    }
  } else if (currentParticipant.npcId) {
    const npc = await npcRepository.getById(currentParticipant.npcId);
    const npcName = npc?.name ?? 'NPC';

    const skipEntry = {
      actorName: npcName,
      message: 'Ход NPC пропущен (не реализован).',
    };
    await encounterLogRepository.create({
      encounterId: encounter.id,
      ...skipEntry,
    });
    newLogEntries.push(skipEntry);
  }

  const freshParticipants = await encounterParticipantRepository.listByEncounterId(encounter.id);
  const freshOrdered = [...freshParticipants].sort((a, b) => a.order - b.order);

  for (const p of freshOrdered) {
    if (p.playerId) {
      const player = await playerRepository.getById(p.playerId);
      if (player?.dead && !p.isOut) {
        await encounterParticipantRepository.update(p.id, { isOut: true });
      }
    } else if (p.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(p.monsterInstanceId);
      if (monster && monster.hpCurrent <= 0 && !p.isOut) {
        await encounterParticipantRepository.update(p.id, { isOut: true });
      }
    }
  }

  const finalParticipants = await encounterParticipantRepository.listByEncounterId(encounter.id);
  const finalOrdered = [...finalParticipants].sort((a, b) => a.order - b.order);

  let nextTurnIndex = encounter.currentTurnIndex + 1;
  let nextRound = encounter.round;

  while (nextTurnIndex < finalOrdered.length && finalOrdered[nextTurnIndex].isOut) {
    nextTurnIndex++;
  }

  if (nextTurnIndex >= finalOrdered.length) {
    nextRound++;
    nextTurnIndex = 0;

    while (nextTurnIndex < finalOrdered.length && finalOrdered[nextTurnIndex].isOut) {
      nextTurnIndex++;
    }
  }

  const updateResult = await encounterRepository.updateConditional(
    encounter.id,
    encounter.currentTurnIndex,
    encounter.round,
    {
      currentTurnIndex: nextTurnIndex,
      round: nextRound,
    }
  );

  if (!updateResult.success) {
    return {
      success: false,
      error: 'Ход уже был продвинут другим запросом.',
      errorCode: 'ALREADY_ADVANCED',
      encounter: null,
      newLogEntries: [],
    };
  }

  const newCurrentParticipant = orderedParticipants[nextTurnIndex];
  if (newCurrentParticipant) {
    await resetActionEconomy(newCurrentParticipant.id);
  }

  const endCheck = await checkEncounterEnd({ encounterId: encounter.id });

  const updatedEncounter = await getActiveEncounter({
    campaignId: input.campaignId,
    playerId: input.playerId,
  });

  return {
    success: true,
    encounter: updatedEncounter.encounter,
    newLogEntries,
    encounterEnded: endCheck.ended,
    encounterResult: endCheck.result ?? undefined,
  };
};
