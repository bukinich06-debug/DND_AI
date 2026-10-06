import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import { CombatFlag, hasFlag } from '@/domain/combat';
import type { IEncounterParticipant } from '@/domain/encounter';
import { syncUnconscious } from '@/domain/player/helpers/syncUnconscious';

export interface ICombatTarget {
  name: string;
  kind: 'player' | 'npc' | 'monster';
  ac: number;
  hp: number;
  maxHp: number;
  isUnconscious: boolean;
  hidden: boolean;
}

export const loadCombatTarget = async (targetParticipant: IEncounterParticipant): Promise<ICombatTarget> => {
  if (targetParticipant.playerId) {
    const player = await playerRepository.getById(targetParticipant.playerId);
    if (!player) throw new Error('Игрок не найден.');
    return {
      name: player.name,
      kind: 'player',
      ac: player.ac,
      hp: player.hpCurrent,
      maxHp: player.hpMax,
      isUnconscious: player.conditions.includes('unconscious'),
      hidden: false,
    };
  }

  if (targetParticipant.npcId) {
    const npc = await npcRepository.getById(targetParticipant.npcId);
    if (!npc) throw new Error('NPC не найден.');
    const statBlock = await npcStatBlockRepository.getByNpcId(targetParticipant.npcId);
    if (!statBlock) throw new Error('NPC статблок не найден.');
    return {
      name: npc.name,
      kind: 'npc',
      ac: statBlock.ac,
      hp: statBlock.hpCurrent,
      maxHp: statBlock.hpMax,
      isUnconscious: false,
      hidden: false,
    };
  }

  if (targetParticipant.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(targetParticipant.monsterInstanceId);
    if (!monster) throw new Error('Монстр-цель не найден.');
    return {
      name: monster.name,
      kind: 'monster',
      ac: monster.ac,
      hp: monster.hpCurrent,
      maxHp: monster.hpMax,
      isUnconscious: false,
      hidden: hasFlag(monster.conditions, CombatFlag.hidden),
    };
  }

  throw new Error('Участник боя не имеет привязанной сущности.');
};

interface IApplyStrikeDamageParams {
  targetParticipant: IEncounterParticipant;
  target: ICombatTarget;
  damageTotal: number;
  isCritical: boolean;
}

export const applyStrikeDamage = async ({
  targetParticipant,
  target,
  damageTotal,
  isCritical,
}: IApplyStrikeDamageParams): Promise<{ newHp: number; deathSaveFailuresAdded: number; targetIsOut: boolean }> => {
  const newHp = Math.max(0, target.hp - damageTotal);
  let deathSaveFailuresAdded = 0;
  let targetIsOut = newHp <= 0;

  if (target.kind === 'player' && targetParticipant.playerId) {
    const player = await playerRepository.getById(targetParticipant.playerId);
    if (player) {
      if (target.hp === 0 && target.isUnconscious) {
        deathSaveFailuresAdded = isCritical ? 2 : 1;
        const newDeathSaveFail = Math.min(3, player.deathSaveFail + deathSaveFailuresAdded);
        const isDead = newDeathSaveFail >= 3;

        await playerRepository.update(targetParticipant.playerId, {
          deathSaveFail: newDeathSaveFail,
          dead: isDead,
        });

        if (isDead) {
          await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
          targetIsOut = true;
        } else targetIsOut = false;
      } else {
        const excessDamage = target.hp > 0 ? Math.max(0, damageTotal - target.hp) : 0;
        const instantDeath = newHp === 0 && excessDamage >= player.hpMax;
        const syncedState = syncUnconscious(newHp, {
          conditions: player.conditions,
          exhaustionLevel: player.exhaustionLevel,
        });

        await playerRepository.update(targetParticipant.playerId, {
          hpCurrent: newHp,
          dead: instantDeath,
          conditions: syncedState.conditions,
          ...(player.isStable && newHp < player.hpCurrent ? { isStable: false } : {}),
        });

        if (instantDeath) {
          await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
          targetIsOut = true;
        }
      }
    }
  } else if (target.kind === 'npc' && targetParticipant.npcId) {
    const statBlock = await npcStatBlockRepository.getByNpcId(targetParticipant.npcId);
    if (statBlock) {
      const { id: _id, ...rest } = statBlock;
      await npcStatBlockRepository.upsert({ ...rest, hpCurrent: newHp });
    }
  } else if (target.kind === 'monster' && targetParticipant.monsterInstanceId) {
    await monsterInstanceRepository.update(targetParticipant.monsterInstanceId, { hpCurrent: newHp });
  }

  if (newHp <= 0 && !targetParticipant.isOut && (target.kind === 'npc' || target.kind === 'monster')) {
    await encounterParticipantRepository.update(targetParticipant.id, { isOut: true });
    targetIsOut = true;
  }

  return { newHp, deathSaveFailuresAdded, targetIsOut };
};
