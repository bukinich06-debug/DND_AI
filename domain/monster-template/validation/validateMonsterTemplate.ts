import type { ICreateMonsterTemplate, IUpdateMonsterTemplate } from '../types';

const MIN_ABILITY = 1;
const MAX_ABILITY = 30;

const assertAbility = (name: string, value: number) => {
  if (value < MIN_ABILITY || value > MAX_ABILITY)
    throw new Error(`${name} должно быть от ${MIN_ABILITY} до ${MAX_ABILITY}.`);
};

const validateCore = (input: Partial<ICreateMonsterTemplate>) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Название шаблона обязательно.');
  if (input.str !== undefined) assertAbility('Сила', input.str);
  if (input.dex !== undefined) assertAbility('Ловкость', input.dex);
  if (input.con !== undefined) assertAbility('Телосложение', input.con);
  if (input.int !== undefined) assertAbility('Интеллект', input.int);
  if (input.wis !== undefined) assertAbility('Мудрость', input.wis);
  if (input.cha !== undefined) assertAbility('Харизма', input.cha);
  if (input.hpMax !== undefined && input.hpMax < 1) throw new Error('Максимум хитов должен быть не меньше 1.');
  if (input.ac !== undefined && input.ac < 0) throw new Error('КД не может быть отрицательным.');
  if (input.speed !== undefined && input.speed < 0) throw new Error('Скорость не может быть отрицательной.');
  if (input.lootCoinsCp !== undefined && input.lootCoinsCp < 0)
    throw new Error('Лут в монетах не может быть отрицательным.');
};

export const validateCreateMonsterTemplate = (input: ICreateMonsterTemplate) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  if (!input.name.trim()) throw new Error('Название шаблона обязательно.');
  assertAbility('Сила', input.str);
  assertAbility('Ловкость', input.dex);
  assertAbility('Телосложение', input.con);
  assertAbility('Интеллект', input.int);
  assertAbility('Мудрость', input.wis);
  assertAbility('Харизма', input.cha);
  if (input.hpMax < 1) throw new Error('Максимум хитов должен быть не меньше 1.');
  if (input.ac < 0) throw new Error('КД не может быть отрицательным.');
  if (input.speed < 0) throw new Error('Скорость не может быть отрицательной.');
  if (input.lootCoinsCp !== undefined && input.lootCoinsCp < 0)
    throw new Error('Лут в монетах не может быть отрицательным.');
};

export const validateUpdateMonsterTemplate = (input: IUpdateMonsterTemplate) => {
  validateCore(input);
};
