import { playerRepository } from '@/data/player';
import { searchPlayerItems } from '@/services/item/search/searchPlayerItems';
import type { ILlmTool, IToolContext } from './types';

interface IGetPlayerCombatStatsArgs {
  playerId: string;
}

const parseArgs = (args: unknown): IGetPlayerCombatStatsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы getPlayerCombatStats обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim())
    throw new Error('playerId обязателен.');

  return {
    playerId: raw.playerId.trim(),
  };
};

const calculateAbilityMod = (score: number): number => Math.floor((score - 10) / 2);

export const getPlayerCombatStatsTool: ILlmTool = {
  name: 'get_player_combat_stats',
  description:
    'Возвращает боевые характеристики игрока: HP, AC, модификаторы характеристик, proficiencyBonus, скорость, и экипированное оружие с damage/range из properties. Используй для проверки возможностей атаки.',
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

    const player = await playerRepository.getById(parsed.playerId);
    if (!player) throw new Error('Игрок не найден.');

    const strMod = calculateAbilityMod(player.str);
    const dexMod = calculateAbilityMod(player.dex);
    const conMod = calculateAbilityMod(player.con);
    const intMod = calculateAbilityMod(player.int);
    const wisMod = calculateAbilityMod(player.wis);
    const chaMod = calculateAbilityMod(player.cha);

    const equippedItems = await searchPlayerItems({
      campaignId: ctx.campaignId,
      playerId: parsed.playerId,
      query: null,
    });

    const weapons = equippedItems.items.filter(
      (item) => item.equipSlot === 'mainHand' || item.equipSlot === 'offHand'
    );

    return {
      id: player.id,
      name: player.name,
      hpMax: player.hpMax,
      hpCurrent: player.hpCurrent,
      ac: player.ac,
      speed: player.speed,
      str: player.str,
      dex: player.dex,
      con: player.con,
      int: player.int,
      wis: player.wis,
      cha: player.cha,
      strMod,
      dexMod,
      conMod,
      intMod,
      wisMod,
      chaMod,
      proficiencyBonus: player.proficiencyBonus,
      weapons: weapons.map((w) => ({
        id: w.id,
        name: w.name,
        equipSlot: w.equipSlot,
        properties: w.properties,
      })),
    };
  },
};
