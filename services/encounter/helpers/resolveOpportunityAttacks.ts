import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { playerRepository } from '@/data/player';
import { CombatFlag, combatSideOf, hasFlag, isIncapacitated, opportunityAttackerIds } from '@/domain/combat';
import type { IEncounterParticipant } from '@/domain/encounter';
import { getAttackType, getCatalogMonsterByKey, isMultiattackAction, type IMonsterAction } from '@/domain/monster';
import { spendAction } from '@/services/encounter/actionEconomy';
import { loadPackFighters } from '@/services/encounter/helpers/loadPackFighters';
import { performMonsterStrike } from '@/services/encounter/helpers/performMonsterStrike';
import { performPlayerMeleeStrike } from '@/services/encounter/helpers/performPlayerMeleeStrike';
import type { IStrikeResult } from '@/services/encounter/helpers/strikeTypes';

interface IResolveOpportunityAttacksParams {
  campaignId: string;
  encounterId: string;
  mover: IEncounterParticipant;
  from: number;
  to: number;
  allParticipants: IEncounterParticipant[];
}

const meleeCatalogAction = (actions: IMonsterAction[] | null | undefined): IMonsterAction | null =>
  (actions ?? []).find((a) => !isMultiattackAction(a) && getAttackType(a) !== 'ranged') ?? null;

const moverDisengaged = async (mover: IEncounterParticipant): Promise<boolean> => {
  if (mover.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(mover.monsterInstanceId);
    return monster ? hasFlag(monster.conditions, CombatFlag.disengaged) : false;
  }
  if (mover.playerId) {
    const player = await playerRepository.getById(mover.playerId);
    return player ? hasFlag(player.conditions, CombatFlag.disengaged) : false;
  }
  return false;
};

const moverCannotContinue = async (moverId: string): Promise<boolean> => {
  const fresh = await encounterParticipantRepository.getById(moverId);
  if (!fresh || fresh.isOut) return true;

  if (fresh.playerId) {
    const player = await playerRepository.getById(fresh.playerId);
    if (!player || player.hpCurrent <= 0 || player.dead) return true;
    return isIncapacitated(player.conditions);
  }

  if (fresh.monsterInstanceId) {
    const monster = await monsterInstanceRepository.getById(fresh.monsterInstanceId);
    if (!monster || monster.hpCurrent <= 0) return true;
    return isIncapacitated(monster.conditions);
  }

  return false;
};

export const resolveOpportunityAttacks = async ({
  campaignId,
  encounterId,
  mover,
  from,
  to,
  allParticipants,
}: IResolveOpportunityAttacksParams): Promise<IStrikeResult[]> => {
  if (from === to) return [];
  if (await moverDisengaged(mover)) return [];

  const fighters = await loadPackFighters(allParticipants);
  const attackerIds = opportunityAttackerIds({
    moverId: mover.id,
    moverSide: combatSideOf(mover),
    from,
    to,
    fighters,
  });

  const results: IStrikeResult[] = [];

  for (const attackerId of attackerIds) {
    if (await moverCannotContinue(mover.id)) break;

    const attackerParticipant = allParticipants.find((p) => p.id === attackerId);
    if (!attackerParticipant || attackerParticipant.isOut || attackerParticipant.reactionUsed) continue;
    if (attackerParticipant.npcId) continue;

    if (attackerParticipant.monsterInstanceId) {
      const monster = await monsterInstanceRepository.getById(attackerParticipant.monsterInstanceId);
      if (!monster || monster.hpCurrent <= 0 || isIncapacitated(monster.conditions)) continue;

      const spend = await spendAction(attackerParticipant.id, 'reaction');
      if (!spend.success) continue;

      let catalog = null;
      try {
        catalog = getCatalogMonsterByKey(monster.catalogKey);
      } catch {
        catalog = null;
      }

      results.push(
        await performMonsterStrike({
          campaignId,
          encounterId,
          attacker: monster,
          attackerParticipant,
          targetParticipant: mover,
          allParticipants,
          action: meleeCatalogAction(catalog?.actions),
          isOpportunityAttack: true,
        })
      );
      continue;
    }

    if (attackerParticipant.playerId) {
      const player = await playerRepository.getById(attackerParticipant.playerId);
      if (!player || player.hpCurrent <= 0 || player.dead || isIncapacitated(player.conditions)) continue;

      const spend = await spendAction(attackerParticipant.id, 'reaction');
      if (!spend.success) continue;

      results.push(
        await performPlayerMeleeStrike({
          campaignId,
          encounterId,
          attacker: player,
          attackerParticipant,
          targetParticipant: mover,
          isOpportunityAttack: true,
        })
      );
    }
  }

  return results;
};
