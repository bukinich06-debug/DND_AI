import { combatSideOf, isIncapacitated, type IPackFighter } from '@/domain/combat';
import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import type { IEncounterParticipant } from '@/domain/encounter';

const capableOf = async (p: IEncounterParticipant): Promise<boolean> => {
  if (p.isOut) return false;

  if (p.playerId) {
    const player = await playerRepository.getById(p.playerId);
    if (!player || player.hpCurrent <= 0 || player.dead) return false;
    return !isIncapacitated(player.conditions);
  }

  if (p.npcId) {
    const statBlock = await npcStatBlockRepository.getByNpcId(p.npcId);
    if (!statBlock || statBlock.hpCurrent <= 0) return false;
    return true;
  }

  if (p.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(p.monsterInstanceId);
    if (!monster || monster.hpCurrent <= 0) return false;
    return !isIncapacitated(monster.conditions);
  }

  return false;
};

export const loadPackFighters = async (participants: IEncounterParticipant[]): Promise<IPackFighter[]> =>
  Promise.all(
    participants.map(async (p) => ({
      id: p.id,
      positionFeet: p.positionFeet,
      side: combatSideOf(p),
      capable: await capableOf(p),
    }))
  );

export const loadPackFightersByEncounter = async (encounterId: string): Promise<IPackFighter[]> => {
  const participants = await encounterParticipantRepository.listByEncounterId(encounterId);
  return loadPackFighters(participants);
};
