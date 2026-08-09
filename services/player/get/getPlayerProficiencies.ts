'use server';

import { campaignRepository } from '@/data/campaign';
import { playerRepository } from '@/data/player';
import {
  validateGetPlayerProficiencies,
  type IGetPlayerProficiencies,
  type IPlayerProficiencies,
} from '@/domain/player';

export const getPlayerProficiencies = async (input: IGetPlayerProficiencies): Promise<IPlayerProficiencies> => {
  validateGetPlayerProficiencies(input);

  const campaign = await campaignRepository.getById(input.campaignId);
  if (!campaign) throw new Error('Кампания не найдена.');

  const player = await playerRepository.getById(input.playerId);
  if (!player) throw new Error('Игрок не найден.');
  if (player.campaignId !== input.campaignId) throw new Error('Игрок не принадлежит этой кампании.');

  return {
    playerId: player.id,
    proficiencyBonus: player.proficiencyBonus,
    skillProf: player.skillProf,
    skillExpertise: player.skillExpertise,
    toolProf: player.toolProf,
    weaponProf: player.weaponProf,
    armorProf: player.armorProf,
  };
};
