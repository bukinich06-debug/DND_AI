import {
  applyDamageModifiers,
  DAMAGE_MODIFIER_LABEL,
  damageTypeLabel,
  formatDamageTypeNote,
  parseDamageType,
  resolveStrikeDamageType,
  sameDamageType,
  UNARMED_DAMAGE_TYPE,
} from '@/domain/combat';
import { loadCatalog as loadItemCatalog } from '@/domain/item/catalog/loadCatalog';
import { isMultiattackAction, loadCatalog } from '@/domain/monster';
import { formatStrikeMessage } from '@/services/encounter/helpers/formatStrikeMessage';
import type { IStrikeResult } from '@/services/encounter/helpers/strikeTypes';

const assert = (cond: unknown, message: string) => {
  if (!cond) throw new Error(message);
};

const catalog = loadCatalog();
const byKey = (key: string) => {
  const entry = catalog.find((m) => m.key === key);
  if (!entry) throw new Error(`Нет монстра ${key}`);
  return entry;
};

for (const monster of catalog) {
  for (const action of monster.actions ?? []) {
    if (isMultiattackAction(action)) {
      assert(!action.damage, `${monster.key}: мультиатака без своего урона`);
      continue;
    }
    if (!action.damage) continue;
    assert(action.damageType && action.damageType.trim(), `${monster.key}.${action.name}: нет damageType`);
    assert(parseDamageType(action.damageType), `${monster.key}.${action.name}: неизвестный тип «${action.damageType}»`);
  }
}

const items = loadItemCatalog();
for (const item of items) {
  for (const prop of item.properties ?? []) {
    if (prop.type !== 'damage') continue;
    assert(prop.damageType && prop.damageType.trim(), `${item.key}: у свойства урона нет damageType`);
    assert(parseDamageType(prop.damageType), `${item.key}: неизвестный тип «${prop.damageType}»`);
  }
}

const skeleton = byKey('skeleton');
assert(
  skeleton.immunities.some((entry) => sameDamageType(entry, 'poison')),
  'скелет: иммунитет к яду'
);
assert(
  skeleton.vulnerabilities.some((entry) => sameDamageType(entry, 'bludgeoning')),
  'скелет: уязвимость к дробящему'
);
assert(skeleton.resistances.length === 0, 'скелет: нет сопротивлений');

assert(UNARMED_DAMAGE_TYPE === 'дробящий', 'безоружная: дробящий');
assert(resolveStrikeDamageType(null) === 'дробящий', 'fallback без типа — дробящий');
assert(resolveStrikeDamageType('piercing') === 'колющий', 'английский piercing → колющий');
assert(resolveStrikeDamageType('рубящий') === 'рубящий', 'русский рубящий остаётся');
assert(sameDamageType('bludgeoning', 'дробящий'), 'синонимы: bludgeoning = дробящий');
assert(sameDamageType('poison', 'яд'), 'синонимы: poison = яд');
assert(sameDamageType('fire', 'огонь'), 'синонимы: fire = огонь');
assert(!sameDamageType('slashing', 'колющий'), 'рубящий ≠ колющий');
assert(damageTypeLabel('acid') === 'кислота', 'acid → кислота');

const none = applyDamageModifiers({
  amount: 7,
  damageType: 'колющий',
  resistances: [],
  immunities: [],
  vulnerabilities: [],
});
assert(none.raw === 7 && none.amount === 7 && none.modifiers.length === 0, 'без защит урон как есть');

const resist = applyDamageModifiers({
  amount: 11,
  damageType: 'piercing',
  resistances: ['колющий'],
  immunities: [],
  vulnerabilities: [],
});
assert(resist.amount === 5 && resist.modifiers[0] === 'resistance', 'сопротивление: 11 → 5');

const vuln = applyDamageModifiers({
  amount: 7,
  damageType: 'дробящий',
  resistances: [],
  immunities: [],
  vulnerabilities: skeleton.vulnerabilities,
});
assert(vuln.amount === 14 && vuln.modifiers[0] === 'vulnerability', 'уязвимость скелета: 7 → 14');

const immune = applyDamageModifiers({
  amount: 8,
  damageType: 'poison',
  resistances: ['яд'],
  immunities: skeleton.immunities,
  vulnerabilities: [],
});
assert(immune.amount === 0 && immune.modifiers[0] === 'immunity', 'иммунитет важнее сопротивления: 8 → 0');

const both = applyDamageModifiers({
  amount: 11,
  damageType: 'огонь',
  resistances: ['fire'],
  immunities: [],
  vulnerabilities: ['огонь'],
});
assert(both.amount === 10, '5e: сначала сопротивление (11→5), затем уязвимость (5→10)');
assert(
  JSON.stringify(both.modifiers) === JSON.stringify(['resistance', 'vulnerability']),
  'оба модификатора, если есть и сопротивление, и уязвимость'
);

assert(DAMAGE_MODIFIER_LABEL.resistance === 'сопротивление', 'метка: сопротивление');
assert(DAMAGE_MODIFIER_LABEL.vulnerability === 'уязвимость', 'метка: уязвимость');
assert(DAMAGE_MODIFIER_LABEL.immunity === 'иммунитет', 'метка: иммунитет');
assert(formatDamageTypeNote('колющий', []) === ' колющий', 'заметка: только тип');
assert(formatDamageTypeNote('дробящий', ['vulnerability']) === ' дробящий (уязвимость)', 'заметка: тип и уязвимость');
assert(formatDamageTypeNote('яд', ['immunity']) === ' яд (иммунитет)', 'заметка: иммунитет');
assert(
  formatDamageTypeNote('огонь', ['resistance', 'vulnerability']) === ' огонь (сопротивление) (уязвимость)',
  'заметка: оба модификатора'
);

const hit: IStrikeResult = {
  hit: true,
  isCritical: false,
  isNatural20: false,
  isNatural1: false,
  attackRoll: 14,
  attackRolls: [14],
  rollMode: 'normal',
  advantageReasons: [],
  packTactics: false,
  revealedFromHide: false,
  attackBonus: 4,
  attackTotal: 18,
  targetAc: 13,
  damageRolls: [3, 2],
  damageBonus: 2,
  damageRaw: 7,
  damageTotal: 14,
  damageType: 'дробящий',
  damageModifiers: ['vulnerability'],
  attackerName: 'Игрок',
  targetName: 'Скелет',
  targetPreviousHp: 13,
  targetNewHp: 0,
  targetMaxHp: 13,
  targetIsOut: true,
  attackName: null,
  weaponName: 'Булава',
  isOpportunityAttack: false,
};
const hitText = formatStrikeMessage(hit);
assert(hitText.includes('дробящий'), 'лог: тип урона');
assert(hitText.includes('(уязвимость)'), 'лог: уязвимость');
assert(hitText.includes('→ 14'), 'лог: урон после уязвимости');
assert(hitText.includes('урон 3+2+2 → 7 дробящий (уязвимость) → 14'), 'лог: полная строка урона');

const immuneHit: IStrikeResult = {
  ...hit,
  damageRolls: [5],
  damageBonus: 3,
  damageRaw: 8,
  damageTotal: 0,
  damageType: 'яд',
  damageModifiers: ['immunity'],
  weaponName: undefined,
  attackName: 'Укус',
  targetNewHp: 13,
  targetIsOut: false,
};
const immuneText = formatStrikeMessage(immuneHit);
assert(immuneText.includes('яд (иммунитет) → 0'), 'лог: иммунитет обнуляет урон');

console.log('ok: damage types and resistances');
