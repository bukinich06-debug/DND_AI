import type { ICoinOwner, ICoinRepository, ITransferCoins } from '@/domain/coins';
import { CoinOwnerKind } from '@/domain/coins';
import { db } from '@/data/shared';
import type { Prisma } from '@/generated/client';

type Tx = Prisma.TransactionClient;
type TransferInput = Omit<ITransferCoins, 'campaignId'>;

const ownerLabel = (owner: ICoinOwner) => {
  if (owner.kind === CoinOwnerKind.player) return 'Игрок';
  if (owner.kind === CoinOwnerKind.npc) return 'NPC';
  return 'Предмет';
};

const readPurse = async (tx: Tx, owner: ICoinOwner) => {
  if (owner.kind === CoinOwnerKind.player) {
    const row = await tx.player.findUnique({
      where: { id: owner.id },
      select: { coinsCp: true, campaignId: true },
    });
    return row;
  }
  if (owner.kind === CoinOwnerKind.npc) {
    const row = await tx.npc.findUnique({
      where: { id: owner.id },
      select: { coinsCp: true, campaignId: true },
    });
    return row;
  }
  const row = await tx.item.findUnique({
    where: { id: owner.id },
    select: { coinsCp: true, campaignId: true },
  });
  return row;
};

const writeCoinsCp = async (tx: Tx, owner: ICoinOwner, coinsCp: number) => {
  if (owner.kind === CoinOwnerKind.player) {
    await tx.player.update({ where: { id: owner.id }, data: { coinsCp } });
    return;
  }
  if (owner.kind === CoinOwnerKind.npc) {
    await tx.npc.update({ where: { id: owner.id }, data: { coinsCp } });
    return;
  }
  await tx.item.update({ where: { id: owner.id }, data: { coinsCp } });
};

export const coinRepository: ICoinRepository = {
  getPurse: async (owner) => {
    if (owner.kind === CoinOwnerKind.player) {
      const row = await db.player.findUnique({
        where: { id: owner.id },
        select: { coinsCp: true, campaignId: true },
      });
      return row;
    }
    if (owner.kind === CoinOwnerKind.npc) {
      const row = await db.npc.findUnique({
        where: { id: owner.id },
        select: { coinsCp: true, campaignId: true },
      });
      return row;
    }
    const row = await db.item.findUnique({
      where: { id: owner.id },
      select: { coinsCp: true, campaignId: true },
    });
    return row;
  },

  transfer: async (input: TransferInput) =>
    db.$transaction(async (tx) => {
      const fromPurse = await readPurse(tx, input.from);
      if (!fromPurse) throw new Error(`${ownerLabel(input.from)} не найден.`);
      const toPurse = await readPurse(tx, input.to);
      if (!toPurse) throw new Error(`${ownerLabel(input.to)} не найден.`);
      if (fromPurse.coinsCp < input.amountCp) throw new Error('Недостаточно монет.');

      const nextFrom = fromPurse.coinsCp - input.amountCp;
      const nextTo = toPurse.coinsCp + input.amountCp;
      await writeCoinsCp(tx, input.from, nextFrom);
      await writeCoinsCp(tx, input.to, nextTo);
      return { fromCoinsCp: nextFrom, toCoinsCp: nextTo };
    }),
};
