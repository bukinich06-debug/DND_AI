import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import type { ILlmTool, IToolContext } from './types';

interface IListCombatTargetsArgs {
  livingOnly?: boolean;
}

const parseArgs = (args: unknown): IListCombatTargetsArgs => {
  if (!args || typeof args !== 'object') return { livingOnly: false };

  const raw = args as Record<string, unknown>;
  return {
    livingOnly: raw.livingOnly === true,
  };
};

export const listCombatTargetsTool: ILlmTool = {
  name: 'list_combat_targets',
  description:
    'Возвращает список всех участников активной боевой сцены с позицией на линии (positionFeet), дистанцией до текущего участника и направлением (впереди/позади), а также AC и HP. Используй, чтобы увидеть доступные цели для атаки, союзников и их состояние. Установи livingOnly=true, чтобы исключить выбывших (isOut=true) участников. encounterId берётся из контекста хода.',
  parameters: {
    type: 'object',
    properties: {
      livingOnly: {
        type: 'boolean',
        description: 'Если true, возвращает только участников с isOut=false',
      },
    },
    required: [],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);

    if (!ctx.encounterId) throw new Error('encounterId отсутствует в контексте.');

    const participants = await encounterParticipantRepository.listByEncounterId(ctx.encounterId);
    const filtered = parsed.livingOnly ? participants.filter((p) => !p.isOut) : participants;

    let currentPosition = 0;
    if (ctx.playerId) {
      const playerParticipant = participants.find((p) => p.playerId === ctx.playerId);
      currentPosition = playerParticipant?.positionFeet ?? 0;
    } else if (ctx.monsterInstanceId) {
      const monsterParticipant = participants.find((p) => p.monsterInstanceId === ctx.monsterInstanceId);
      currentPosition = monsterParticipant?.positionFeet ?? 0;
    }

    const result = await Promise.all(
      filtered.map(async (p) => {
        let name = 'Неизвестный';
        let kind: 'player' | 'npc' | 'monster' = 'monster';
        let hp: number | null = null;
        let ac: number | null = null;

        if (p.playerId) {
          const player = await playerRepository.getById(p.playerId);
          if (player) {
            name = player.name;
            kind = 'player';
            hp = player.hpCurrent;
            ac = player.ac;
          }
        } else if (p.npcId) {
          const npc = await npcRepository.getById(p.npcId);
          if (npc) {
            name = npc.name;
            kind = 'npc';
            const statBlock = await npcStatBlockRepository.getByNpcId(p.npcId);
            hp = statBlock?.hpCurrent ?? null;
            ac = statBlock?.ac ?? null;
          }
        } else if (p.monsterInstanceId) {
          const monster = await monsterInstanceRepository.getById(p.monsterInstanceId);
          if (monster) {
            name = monster.name;
            kind = 'monster';
            hp = monster.hpCurrent;
            ac = monster.ac;
          }
        }

        const distance = Math.abs(p.positionFeet - currentPosition);
        const direction =
          p.positionFeet > currentPosition ? 'впереди' : p.positionFeet < currentPosition ? 'позади' : 'на месте';

        return {
          participantId: p.id,
          name,
          kind,
          initiative: p.initiative,
          order: p.order,
          isOut: p.isOut,
          hp,
          ac,
          positionFeet: p.positionFeet,
          distance,
          direction,
          playerId: p.playerId,
          npcId: p.npcId,
          monsterInstanceId: p.monsterInstanceId,
        };
      })
    );

    return result;
  },
};
