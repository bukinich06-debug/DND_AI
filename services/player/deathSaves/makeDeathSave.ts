'use server';

import { playerRepository } from '@/data/player';
import { rollDice } from '@/services/dice/roll/rollDice';
import { DiceKind } from '@/domain/shared';
import { removeCondition } from '@/domain/player';

interface IMakeDeathSaveInput {
  playerId: string;
  campaignId: string;
}

interface IMakeDeathSaveResult {
  success: boolean;
  roll: number;
  deathSaveSuccess: number;
  deathSaveFail: number;
  isDead: boolean;
  isStable: boolean;
  isRevived: boolean;
  hpCurrent: number;
}

export const makeDeathSave = async (input: IMakeDeathSaveInput): Promise<IMakeDeathSaveResult> => {
  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');

  if (player.hpCurrent > 0) throw new Error('Игрок не при нуле HP, спасбросок от смерти не требуется.');
  if (player.dead) throw new Error('Игрок уже мёртв.');
  if (player.isStable) throw new Error('Игрок уже стабилен.');

  const rollResult = await rollDice({
    campaignId: input.campaignId,
    die: DiceKind.d20,
    note: `Спасбросок от смерти (${player.name})`,
    playerId: input.playerId,
    npcId: null,
  });

  const roll = rollResult.value;
  let deathSaveSuccess = player.deathSaveSuccess;
  let deathSaveFail = player.deathSaveFail;
  let isDead = false;
  let isStable = false;
  let isRevived = false;
  let hpCurrent = player.hpCurrent;
  let conditions = player.conditions;

  if (roll === 1) {
    deathSaveFail = Math.min(3, deathSaveFail + 2);
  } else if (roll === 20) {
    deathSaveSuccess = 0;
    deathSaveFail = 0;
    hpCurrent = 1;
    isRevived = true;
    conditions = removeCondition({
      state: { conditions, exhaustionLevel: player.exhaustionLevel },
      condition: 'unconscious',
    }).conditions;
  } else if (roll >= 10) {
    deathSaveSuccess = Math.min(3, deathSaveSuccess + 1);
  } else {
    deathSaveFail = Math.min(3, deathSaveFail + 1);
  }

  if (deathSaveFail >= 3) {
    isDead = true;
    await playerRepository.update(player.id, {
      dead: true,
      deathSaveSuccess: 0,
      deathSaveFail: 3,
    });
  } else if (deathSaveSuccess >= 3) {
    isStable = true;
    await playerRepository.update(player.id, {
      isStable: true,
      deathSaveSuccess: 3,
      deathSaveFail,
    });
  } else if (isRevived) {
    await playerRepository.update(player.id, {
      hpCurrent,
      deathSaveSuccess: 0,
      deathSaveFail: 0,
      isStable: false,
      conditions,
    });
  } else {
    await playerRepository.update(player.id, {
      deathSaveSuccess,
      deathSaveFail,
    });
  }

  return {
    success: roll >= 10 || roll === 20,
    roll,
    deathSaveSuccess,
    deathSaveFail,
    isDead,
    isStable,
    isRevived,
    hpCurrent,
  };
};
