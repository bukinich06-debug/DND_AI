import { getPlayerProficiencies } from '@/services/player/get/getPlayerProficiencies';
import type { ILlmTool, IToolContext } from './types';

interface IGetPlayerProficienciesArgs {
  playerId: string;
}

const parseArgs = (args: unknown): IGetPlayerProficienciesArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы запроса владений обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('id игрока обязателен.');

  return { playerId: raw.playerId.trim() };
};

export const getPlayerProficienciesTool: ILlmTool = {
  name: 'get_player_proficiencies',
  description:
    'Возвращает владения игрока: навыки (skillProf/skillExpertise), инструменты (toolProf), оружие и доспехи, бонус мастерства. Для воровских инструментов смотри toolProf (ключ thievesTools), это не навык. Перед действием с инструментом или навыком вызывай вместе с search_player_items.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ID игрока',
      },
    },
    required: ['playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const result = await getPlayerProficiencies({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
    });

    return {
      playerId: result.playerId,
      proficiencyBonus: result.proficiencyBonus,
      skillProf: result.skillProf,
      skillExpertise: result.skillExpertise,
      toolProf: result.toolProf,
      weaponProf: result.weaponProf,
      armorProf: result.armorProf,
    };
  },
};
