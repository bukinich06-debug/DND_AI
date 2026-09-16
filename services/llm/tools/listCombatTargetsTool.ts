import { encounterParticipantRepository } from '@/data/encounter';
import { monsterInstanceRepository } from '@/data/monster';
import { npcRepository, npcStatBlockRepository } from '@/data/npc';
import { playerRepository } from '@/data/player';
import type { ILlmTool, IToolContext } from './types';

interface IListCombatTargetsArgs {
  encounterId: string;
  livingOnly?: boolean;
}

const parseArgs = (args: unknown): IListCombatTargetsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы listCombatTargets обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.encounterId !== 'string' || !raw.encounterId.trim())
    throw new Error('encounterId обязателен.');

  return {
    encounterId: raw.encounterId.trim(),
    livingOnly: raw.livingOnly === true,
  };
};

export const listCombatTargetsTool: ILlmTool = {
  name: 'list_combat_targets',
  description:
    'Возвращает список всех участников активной боевой сцены. Используй, чтобы увидеть доступные цели для атаки, союзников и их состояние. Передай encounterId текущего боя. Установи livingOnly=true, чтобы исключить выбывших (isOut=true) участников.',
  parameters: {
    type: 'object',
    properties: {
      encounterId: {
        type: 'string',
        description: 'ID боевой сцены',
      },
      livingOnly: {
        type: 'boolean',
        description: 'Если true, возвращает только участников с isOut=false',
      },
    },
    required: ['encounterId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const participants = await encounterParticipantRepository.listByEncounterId(parsed.encounterId);
    const filtered = parsed.livingOnly ? participants.filter((p) => !p.isOut) : participants;

    const result = await Promise.all(
      filtered.map(async (p) => {
        let name = 'Неизвестный';
        let kind: 'player' | 'npc' | 'monster' = 'monster';
        let hp: number | null = null;

        if (p.playerId) {
          const player = await playerRepository.getById(p.playerId);
          if (player) {
            name = player.name;
            kind = 'player';
            hp = player.hpCurrent;
          }
        } else if (p.npcId) {
          const npc = await npcRepository.getById(p.npcId);
          if (npc) {
            name = npc.name;
            kind = 'npc';
            const statBlock = await npcStatBlockRepository.getByNpcId(p.npcId);
            hp = statBlock?.hpCurrent ?? null;
          }
        } else if (p.monsterInstanceId) {
          const monster = await monsterInstanceRepository.getById(p.monsterInstanceId);
          if (monster) {
            name = monster.name;
            kind = 'monster';
            hp = monster.hpCurrent;
          }
        }

        return {
          participantId: p.id,
          name,
          kind,
          initiative: p.initiative,
          order: p.order,
          isOut: p.isOut,
          hp,
          playerId: p.playerId,
          npcId: p.npcId,
          monsterInstanceId: p.monsterInstanceId,
        };
      })
    );

    return result;
  },
};
