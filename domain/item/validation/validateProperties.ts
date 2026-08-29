import { getWeaponMastery } from '../catalog/mastery';
import type { IItemProp } from '../types';

const assertText = (raw: unknown) => {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('У свойства должно быть текстовое описание.');
  return raw.trim();
};

const assertDice = (raw: unknown) => {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('Укажите кубики свойства.');
  return raw.trim();
};

const parseOne = (raw: unknown): IItemProp => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Свойство предмета должно быть объектом.');
  const row = raw as Record<string, unknown>;
  const type = row.type;

  if (type === 'mastery') {
    if (typeof row.mastery !== 'string' || !row.mastery.trim()) throw new Error('Укажите искусность оружия.');
    const def = getWeaponMastery(row.mastery.trim());
    const text = typeof row.text === 'string' && row.text.trim() ? row.text.trim() : def.text;
    return { type: 'mastery', text, mastery: def.key };
  }

  const text = assertText(row.text);

  if (type === 'damage') {
    if (row.damageType !== undefined) {
      if (typeof row.damageType !== 'string' || !row.damageType.trim())
        throw new Error('Тип урона должен быть строкой.');
      return { type: 'damage', text, dice: assertDice(row.dice), damageType: row.damageType.trim() };
    }
    return { type: 'damage', text, dice: assertDice(row.dice) };
  }

  if (type === 'range') {
    if (typeof row.normal !== 'number' || row.normal < 0) throw new Error('Дистанция должна быть числом не меньше 0.');
    if (row.long !== undefined) {
      if (typeof row.long !== 'number' || row.long < 0)
        throw new Error('Дальняя дистанция должна быть числом не меньше 0.');
      return { type: 'range', text, normal: row.normal, long: row.long };
    }
    return { type: 'range', text, normal: row.normal };
  }

  if (type === 'ac') {
    if (typeof row.base !== 'number' || row.base < 0) throw new Error('КД должно быть числом не меньше 0.');
    if (typeof row.addDex !== 'boolean') throw new Error('Укажите, добавляется ли ловкость к КД.');
    return { type: 'ac', text, base: row.base, addDex: row.addDex };
  }

  if (type === 'heal') return { type: 'heal', text, dice: assertDice(row.dice) };
  if (type === 'twoHanded') return { type: 'twoHanded', text };
  if (type === 'stealthDisadvantage') return { type: 'stealthDisadvantage', text };
  if (type === 'note') return { type: 'note', text };

  throw new Error('Неизвестный тип свойства предмета.');
};

export const parseItemProperties = (raw: unknown): IItemProp[] | null => {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const parsed: IItemProp[] = [];
  for (const item of raw) {
    try {
      parsed.push(parseOne(item));
    } catch {
      continue;
    }
  }
  return parsed.length ? parsed : [];
};

export const validateItemProperties = (raw: unknown) => {
  if (raw == null) return;
  if (!Array.isArray(raw)) throw new Error('Свойства предмета должны быть массивом.');
  for (const item of raw) parseOne(item);
};

export const isTwoHanded = (properties: IItemProp[] | null) =>
  Boolean(properties?.some((prop) => prop.type === 'twoHanded'));
