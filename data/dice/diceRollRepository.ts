import type { DiceRoll } from '@/generated/client';
import type { ICreateDiceRoll, IDiceRoll, IDiceRollRepository } from '@/domain/dice';
import { db } from '@/data/shared';

const mapDiceRoll = (row: DiceRoll): IDiceRoll => ({
  id: row.id,
  campaignId: row.campaignId,
  die: row.die,
  value: row.value,
  note: row.note,
  playerId: row.playerId,
  npcId: row.npcId,
  rolledAt: row.rolledAt,
});

export const diceRollRepository: IDiceRollRepository = {
  create: async (input: ICreateDiceRoll) => {
    const row = await db.diceRoll.create({
      data: {
        campaignId: input.campaignId,
        die: input.die,
        value: input.value,
        note: input.note ?? null,
        playerId: input.playerId ?? null,
        npcId: input.npcId ?? null,
      },
    });
    return mapDiceRoll(row);
  },

  listByCampaignId: async (campaignId: string) => {
    const rows = await db.diceRoll.findMany({
      where: { campaignId },
      orderBy: { rolledAt: 'desc' },
    });
    return rows.map(mapDiceRoll);
  },
};
