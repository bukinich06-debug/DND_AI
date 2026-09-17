'use server';

import { encounterRepository, encounterParticipantRepository, encounterLogRepository } from '@/data/encounter';
import { playerRepository } from '@/data/player';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { monsterInstanceRepository } from '@/data/monster';
import type { IEncounterLog } from '@/domain/encounter';

interface IGetActiveEncounterInput {
  campaignId: string;
  playerId?: string;
}

interface IParticipantInfo {
  id: string;
  kind: 'player' | 'npc' | 'monster';
  displayName: string;
  hpCurrent: number;
  hpMax: number;
  initiative: number;
  feetFromPlayer: number;
  isOut: boolean;
  playerId: string | null;
  npcId: string | null;
  monsterInstanceId: string | null;
}

interface IGetActiveEncounterResult {
  hasActiveEncounter: boolean;
  encounter: {
    encounterId: string;
    round: number;
    currentTurnIndex: number;
    status: string;
    currentParticipantId: string | null;
    isPlayerTurn: boolean;
    participants: IParticipantInfo[];
    log: IEncounterLog[];
  } | null;
}

export const getActiveEncounter = async (
  input: IGetActiveEncounterInput
): Promise<IGetActiveEncounterResult> => {
  const encounter = await encounterRepository.getActiveByCampaignId(input.campaignId);

  if (!encounter) {
    return {
      hasActiveEncounter: false,
      encounter: null,
    };
  }

  const participants = await encounterParticipantRepository.listByEncounterId(encounter.id);

  const participantInfos: IParticipantInfo[] = [];

  for (const participant of participants) {
    let displayName = 'Unknown';
    let hpCurrent = 0;
    let hpMax = 0;
    let kind: 'player' | 'npc' | 'monster' = 'player';

    if (participant.playerId) {
      const player = await playerRepository.getById(participant.playerId);
      if (player) {
        displayName = player.name;
        hpCurrent = player.hpCurrent;
        hpMax = player.hpMax;
        kind = 'player';
      }
    } else if (participant.npcId) {
      const npc = await npcRepository.getById(participant.npcId);
      if (npc) {
        displayName = npc.name;
        const statBlock = await npcStatBlockRepository.getByNpcId(npc.id);
        if (statBlock) {
          hpCurrent = statBlock.hpCurrent;
          hpMax = statBlock.hpMax;
        }
        kind = 'npc';
      }
    } else if (participant.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(participant.monsterInstanceId);
      if (monster) {
        displayName = monster.name;
        hpCurrent = monster.hpCurrent;
        hpMax = monster.hpMax;
        kind = 'monster';
      }
    }

    participantInfos.push({
      id: participant.id,
      kind,
      displayName,
      hpCurrent,
      hpMax,
      initiative: participant.initiative,
      feetFromPlayer: participant.feetFromPlayer,
      isOut: participant.isOut,
      playerId: participant.playerId,
      npcId: participant.npcId,
      monsterInstanceId: participant.monsterInstanceId,
    });
  }

  const currentParticipant =
    participants.length > 0 && encounter.currentTurnIndex < participants.length
      ? participants[encounter.currentTurnIndex]
      : null;

  const isPlayerTurn =
    currentParticipant != null && input.playerId != null && currentParticipant.playerId === input.playerId;

  const log = await encounterLogRepository.listByEncounterId(encounter.id);

  return {
    hasActiveEncounter: true,
    encounter: {
      encounterId: encounter.id,
      round: encounter.round,
      currentTurnIndex: encounter.currentTurnIndex,
      status: encounter.status,
      currentParticipantId: currentParticipant?.id ?? null,
      isPlayerTurn,
      participants: participantInfos,
      log,
    },
  };
};
