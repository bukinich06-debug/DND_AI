import type { ICreatePlayer, IUpdatePlayer } from '../types';

const MIN_ABILITY = 1;
const MAX_ABILITY = 30;
const MAX_LEVEL = 20;

const assertAbility = (name: string, value: number) => {
  if (value < MIN_ABILITY || value > MAX_ABILITY)
    throw new Error(`${name} должно быть от ${MIN_ABILITY} до ${MAX_ABILITY}.`);
};

const assertNonNeg = (name: string, value: number) => {
  if (value < 0) throw new Error(`${name} не может быть отрицательным.`);
};

const validateCore = (input: Partial<ICreatePlayer>) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Имя персонажа обязательно.');
  if (input.species !== undefined && !input.species.trim()) throw new Error('Вид персонажа обязателен.');
  if (input.className !== undefined && !input.className.trim()) throw new Error('Класс персонажа обязателен.');
  if (input.background !== undefined && !input.background.trim()) throw new Error('Предыстория обязательна.');
  if (input.hitDie !== undefined && !input.hitDie.trim()) throw new Error('Кость хитов обязательна.');

  if (input.level !== undefined) {
    if (input.level < 1 || input.level > MAX_LEVEL) throw new Error(`Уровень должен быть от 1 до ${MAX_LEVEL}.`);
  }

  if (input.str !== undefined) assertAbility('Сила', input.str);
  if (input.dex !== undefined) assertAbility('Ловкость', input.dex);
  if (input.con !== undefined) assertAbility('Телосложение', input.con);
  if (input.int !== undefined) assertAbility('Интеллект', input.int);
  if (input.wis !== undefined) assertAbility('Мудрость', input.wis);
  if (input.cha !== undefined) assertAbility('Харизма', input.cha);

  if (input.hpMax !== undefined) {
    if (input.hpMax < 1) throw new Error('Максимум хитов должен быть не меньше 1.');
  }
  if (input.hpCurrent !== undefined) assertNonNeg('Текущие хиты', input.hpCurrent);
  if (input.hpTemp !== undefined) assertNonNeg('Временные хиты', input.hpTemp);
  if (input.ac !== undefined) assertNonNeg('КД', input.ac);
  if (input.speed !== undefined) assertNonNeg('Скорость', input.speed);
  if (input.proficiencyBonus !== undefined) assertNonNeg('Бонус мастерства', input.proficiencyBonus);
  if (input.hitDiceLeft !== undefined) assertNonNeg('Оставшиеся кости хитов', input.hitDiceLeft);
  if (input.deathSaveSuccess !== undefined) assertNonNeg('Успехи спасбросков от смерти', input.deathSaveSuccess);
  if (input.deathSaveFail !== undefined) assertNonNeg('Провалы спасбросков от смерти', input.deathSaveFail);
  if (input.coinsCp !== undefined) assertNonNeg('Монеты', input.coinsCp);

  if (input.hpMax !== undefined && input.hpCurrent !== undefined && input.hpCurrent > input.hpMax)
    throw new Error('Текущие хиты не могут превышать максимум.');
};

export const validateCreatePlayer = (input: ICreatePlayer) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  validateCore(input);
  if (input.hpCurrent > input.hpMax) throw new Error('Текущие хиты не могут превышать максимум.');
};

export const validateUpdatePlayer = (input: IUpdatePlayer) => {
  validateCore(input);
};
