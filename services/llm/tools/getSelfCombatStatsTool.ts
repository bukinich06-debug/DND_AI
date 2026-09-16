import { getCatalogMonsterByKey } from '@/domain/monster/catalog';
import { monsterInstanceRepository } from '@/data/monster';
import type { ILlmTool, IToolContext } from './types';

interface IGetSelfCombatStatsArgs {
  monsterInstanceId: string;
}

const parseArgs = (args: unknown): IGetSelfCombatStatsArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы getSelfCombatStats обязательны.');

  const raw = args as Record<string, unknown>;
  if (typeof raw.monsterInstanceId !== 'string' || !raw.monsterInstanceId.trim())
    throw new Error('monsterInstanceId обязателен.');

  return {
    monsterInstanceId: raw.monsterInstanceId.trim(),
  };
};

const calculateAbilityMod = (score: number): number => Math.floor((score - 10) / 2);

export const getSelfCombatStatsTool: ILlmTool = {
  name: 'get_self_combat_stats',
  description:
    'Возвращает боевые характеристики этого монстра: HP, AC, модификаторы характеристик, доступные атаки из справочника (actions), черты (traits) и способности. Используй, чтобы узнать свои возможности атаки и урон.',
  parameters: {
    type: 'object',
    properties: {
      monsterInstanceId: {
        type: 'string',
        description: 'ID экземпляра монстра',
      },
    },
    required: ['monsterInstanceId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, _ctx: IToolContext) => {
    const parsed = parseArgs(args);

    const instance = await monsterInstanceRepository.getById(parsed.monsterInstanceId);
    if (!instance) throw new Error('Монстр не найден.');

    let catalogEntry = null;
    try {
      catalogEntry = getCatalogMonsterByKey(instance.catalogKey);
    } catch {
      // Справочная запись отсутствует — продолжаем с instance
    }

    const strMod = calculateAbilityMod(instance.str);
    const dexMod = calculateAbilityMod(instance.dex);
    const conMod = calculateAbilityMod(instance.con);
    const intMod = calculateAbilityMod(instance.int);
    const wisMod = calculateAbilityMod(instance.wis);
    const chaMod = calculateAbilityMod(instance.cha);

    return {
      id: instance.id,
      name: instance.name,
      catalogKey: instance.catalogKey,
      hpMax: instance.hpMax,
      hpCurrent: instance.hpCurrent,
      ac: instance.ac,
      speed: instance.speed,
      str: instance.str,
      dex: instance.dex,
      con: instance.con,
      int: instance.int,
      wis: instance.wis,
      cha: instance.cha,
      strMod,
      dexMod,
      conMod,
      intMod,
      wisMod,
      chaMod,
      saveProf: instance.saveProf,
      resistances: instance.resistances,
      immunities: instance.immunities,
      vulnerabilities: instance.vulnerabilities,
      conditionImmunities: instance.conditionImmunities,
      conditions: instance.conditions,
      traits: catalogEntry?.traits ?? null,
      actions: catalogEntry?.actions ?? null,
      reactions: catalogEntry?.reactions ?? null,
      legendaryActions: catalogEntry?.legendaryActions ?? null,
    };
  },
};
