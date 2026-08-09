import type { IUpsertNpcStatBlock } from '../statBlockTypes';

const MIN_ABILITY = 1;
const MAX_ABILITY = 30;

const assertAbility = (name: string, value: number) => {
  if (value < MIN_ABILITY || value > MAX_ABILITY)
    throw new Error(`${name} должно быть от ${MIN_ABILITY} до ${MAX_ABILITY}.`);
};

export const validateUpsertNpcStatBlock = (input: IUpsertNpcStatBlock) => {
  if (!input.npcId.trim()) throw new Error('NPC обязателен.');
  assertAbility('Сила', input.str);
  assertAbility('Ловкость', input.dex);
  assertAbility('Телосложение', input.con);
  assertAbility('Интеллект', input.int);
  assertAbility('Мудрость', input.wis);
  assertAbility('Харизма', input.cha);
  if (input.hpMax < 1) throw new Error('Максимум хитов должен быть не меньше 1.');
  if (input.hpCurrent < 0) throw new Error('Текущие хиты не могут быть отрицательными.');
  if (input.hpCurrent > input.hpMax) throw new Error('Текущие хиты не могут превышать максимум.');
  if (input.ac < 0) throw new Error('КД не может быть отрицательным.');
  if (input.speed < 0) throw new Error('Скорость не может быть отрицательной.');
};
