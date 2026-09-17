import type { EncounterParticipant } from '@/generated/client';
import type {
  ICreateEncounterParticipant,
  IEncounterParticipant,
  IEncounterParticipantRepository,
  IUpdateEncounterParticipant,
} from '@/domain/encounter';
import { db } from '@/data/shared';

const mapParticipant = (row: EncounterParticipant): IEncounterParticipant => ({
  id: row.id,
  encounterId: row.encounterId,
  initiative: row.initiative,
  order: row.order,
  isOut: row.isOut,
  feetFromPlayer: row.feetFromPlayer,
  playerId: row.playerId,
  npcId: row.npcId,
  monsterInstanceId: row.monsterInstanceId,
});

const validateExactlyOneEntity = (input: {
  playerId?: string | null;
  npcId?: string | null;
  monsterInstanceId?: string | null;
}) => {
  const count = [input.playerId, input.npcId, input.monsterInstanceId].filter((x) => x != null).length;
  if (count !== 1) throw new Error('Участник должен иметь ровно один из: playerId, npcId, monsterInstanceId.');
};

export const encounterParticipantRepository: IEncounterParticipantRepository = {
  create: async (input: ICreateEncounterParticipant) => {
    validateExactlyOneEntity(input);

    const row = await db.encounterParticipant.create({
      data: {
        encounterId: input.encounterId,
        initiative: input.initiative,
        order: input.order,
        isOut: input.isOut ?? false,
        feetFromPlayer: input.feetFromPlayer ?? 30,
        playerId: input.playerId ?? null,
        npcId: input.npcId ?? null,
        monsterInstanceId: input.monsterInstanceId ?? null,
      },
    });
    return mapParticipant(row);
  },

  getById: async (id) => {
    const row = await db.encounterParticipant.findUnique({ where: { id } });
    if (!row) return null;
    return mapParticipant(row);
  },

  listByEncounterId: async (encounterId) => {
    const rows = await db.encounterParticipant.findMany({
      where: { encounterId },
      orderBy: { order: 'asc' },
    });
    return rows.map(mapParticipant);
  },

  update: async (id, input: IUpdateEncounterParticipant) => {
    if (input.playerId !== undefined || input.npcId !== undefined || input.monsterInstanceId !== undefined) {
      const current = await db.encounterParticipant.findUnique({ where: { id } });
      if (!current) throw new Error('Участник не найден.');

      const updated = {
        playerId: input.playerId !== undefined ? input.playerId : current.playerId,
        npcId: input.npcId !== undefined ? input.npcId : current.npcId,
        monsterInstanceId:
          input.monsterInstanceId !== undefined ? input.monsterInstanceId : current.monsterInstanceId,
      };
      validateExactlyOneEntity(updated);
    }

    const row = await db.encounterParticipant.update({
      where: { id },
      data: {
        ...(input.initiative !== undefined ? { initiative: input.initiative } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isOut !== undefined ? { isOut: input.isOut } : {}),
        ...(input.feetFromPlayer !== undefined ? { feetFromPlayer: input.feetFromPlayer } : {}),
        ...(input.playerId !== undefined ? { playerId: input.playerId } : {}),
        ...(input.npcId !== undefined ? { npcId: input.npcId } : {}),
        ...(input.monsterInstanceId !== undefined ? { monsterInstanceId: input.monsterInstanceId } : {}),
      },
    });
    return mapParticipant(row);
  },

  delete: async (id) => {
    await db.encounterParticipant.delete({ where: { id } });
  },
};
