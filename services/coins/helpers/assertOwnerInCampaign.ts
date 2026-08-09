import { coinRepository } from '@/data/coins';
import { CoinOwnerKind, type ICoinOwner } from '@/domain/coins';

const ownerLabel = (owner: ICoinOwner) => {
  if (owner.kind === CoinOwnerKind.player) return 'Игрок';
  if (owner.kind === CoinOwnerKind.npc) return 'NPC';
  return 'Предмет';
};

export const assertOwnerInCampaign = async (campaignId: string, owner: ICoinOwner) => {
  const purse = await coinRepository.getPurse(owner);
  if (!purse) throw new Error(`${ownerLabel(owner)} не найден.`);
  if (purse.campaignId !== campaignId) throw new Error(`${ownerLabel(owner)} не принадлежит этой кампании.`);
  return purse;
};
