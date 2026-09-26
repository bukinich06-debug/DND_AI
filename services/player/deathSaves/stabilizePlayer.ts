'use server';

import { playerRepository } from '@/data/player';
import { removeCondition } from '@/domain/player';

interface IStabilizePlayerInput {
  playerId: string;
  restoreHp?: number;
  removeUnconscious?: boolean;
}

export const stabilizePlayer = async (input: IStabilizePlayerInput): Promise<void> => {
  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');

  const hpCurrent = input.restoreHp !== undefined ? Math.min(player.hpMax, input.restoreHp) : player.hpCurrent;

  let conditions = player.conditions;
  if (input.removeUnconscious && hpCurrent > 0) {
    conditions = removeCondition({
      state: { conditions: player.conditions, exhaustionLevel: player.exhaustionLevel },
      condition: 'unconscious',
    }).conditions;
  }

  await playerRepository.update(player.id, {
    hpCurrent,
    deathSaveSuccess: 0,
    deathSaveFail: 0,
    isStable: hpCurrent === 0,
    conditions,
  });
};
