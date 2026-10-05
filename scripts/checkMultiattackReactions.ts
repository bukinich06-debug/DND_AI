import {
  isInMeleeReach,
  leavesReachOnPath,
  MELEE_REACH_FEET,
  opportunityAttackerIds,
  type TCombatSide,
} from '@/domain/combat';
import {
  expandMultiattack,
  isActionInRange,
  isMultiattackAction,
  isMultiattackName,
  loadCatalog,
  pickDefaultAttack,
  type IMonsterAction,
} from '@/domain/monster';

const assert = (cond: unknown, message: string) => {
  if (!cond) throw new Error(message);
};

const catalog = loadCatalog();
const byKey = (key: string) => {
  const entry = catalog.find((m) => m.key === key);
  if (!entry) throw new Error(`Нет монстра ${key}`);
  return entry;
};

const goblin = byKey('goblin');
const hobgoblin = byKey('hobgoblin');
const wolf = byKey('wolf');

assert(!goblin.actions?.some(isMultiattackAction), 'гоблин: нет мультиатаки');
assert(!wolf.actions?.some(isMultiattackAction), 'волк: нет мультиатаки');

assert(isMultiattackName('Мультиатака'), 'имя: Мультиатака');
assert(isMultiattackName('multiattack'), 'имя: multiattack');
assert(!isMultiattackName('Длинный меч'), 'имя: не меч');

const hobMulti = hobgoblin.actions?.find(isMultiattackAction);
if (!hobMulti) throw new Error('хобгоблин: нет мультиатаки в каталоге');
const hobStrikes = expandMultiattack(hobMulti, hobgoblin.actions ?? []);
assert(hobStrikes.length === 2, 'хобгоблин: две атаки мечом');
assert(
  hobStrikes.every((a) => a.name === 'Длинный меч' && a.damage === '1d8+1'),
  'хобгоблин: обе атаки — длинный меч из каталога'
);

const testActions: IMonsterAction[] = [
  {
    name: 'Мультиатака',
    description: 'Укус и когти.',
    multiattack: [
      { attack: 'Укус', count: 1 },
      { attack: 'Когти', count: 1 },
    ],
  },
  {
    name: 'Укус',
    description: 'Рукопашная атака',
    attackBonus: 5,
    damage: '1d8+3',
    damageType: 'колющий',
    attackType: 'melee',
  },
  {
    name: 'Когти',
    description: 'Рукопашная атака',
    attackBonus: 5,
    damage: '2d6+3',
    damageType: 'рубящий',
    attackType: 'melee',
  },
  {
    name: 'Камень',
    description: 'Дальнобойная атака',
    attackBonus: 4,
    damage: '1d8+2',
    attackType: 'ranged',
    rangeNormal: 60,
  },
];

const testMulti = testActions.find(isMultiattackAction);
if (!testMulti) throw new Error('тест: нет мультиатаки');
const expanded = expandMultiattack(testMulti, testActions);
assert(expanded.length === 2, 'тест: две разные атаки');
assert(expanded[0]?.name === 'Укус' && expanded[1]?.name === 'Когти', 'тест: укус затем когти');
assert(
  expanded.every((a) => a.damage),
  'тест: у каждой атаки свой урон'
);

const english: IMonsterAction[] = [
  {
    name: 'Multiattack',
    description: 'Two bites.',
    multiattack: [{ attack: 'Bite', count: 2 }],
  },
  { name: 'Bite', description: 'Melee', attackBonus: 4, damage: '1d6+2', attackType: 'melee' },
];
assert(isMultiattackAction(english[0]!), 'english: multiattack по имени');
assert(expandMultiattack(english[0]!, english).length === 2, 'english: count=2');

assert(pickDefaultAttack(testActions, 5)?.name === 'Мультиатака', 'выбор: в 5 фт — мультиатака');
assert(pickDefaultAttack(testActions, 40)?.name === 'Камень', 'выбор: в 40 фт — дальнобойная, не мультиатака');
assert(pickDefaultAttack(goblin.actions ?? [], 5)?.name === 'Короткий меч', 'выбор: гоблин вблизи — меч');
assert(isActionInRange(hobMulti, 5) === false, 'мультиатака сама не удар ближнего боя');

assert(MELEE_REACH_FEET === 5, 'досягаемость 5 фт');
assert(isInMeleeReach(0, 5), 'в досягаемости: 5 фт');
assert(!isInMeleeReach(0, 6), 'вне досягаемости: 6 фт');

assert(leavesReachOnPath(5, 20, 0), 'выход: 5→20 от врага в 0');
assert(!leavesReachOnPath(5, 5, 0), 'на месте — не выход');
assert(!leavesReachOnPath(20, 5, 0), 'вход в досягаемость — не провокация');
assert(!leavesReachOnPath(5, 0, 0), 'ещё ближе — не выход');
assert(leavesReachOnPath(10, -10, 0), 'проход сквозь врага: 10→-10 через 0');
assert(leavesReachOnPath(0, 30, -5), 'игрок 0→30 оставляет врага позади в -5');
assert(!leavesReachOnPath(0, 4, 10), 'приближение к врагу в 10, остаёмся вне 5');

const party: TCombatSide = 'party';
const monsters: TCombatSide = 'monsters';
const ids = opportunityAttackerIds({
  moverId: 'p1',
  moverSide: party,
  from: 0,
  to: 20,
  fighters: [
    { id: 'p1', side: party, positionFeet: 0, capable: true },
    { id: 'g1', side: monsters, positionFeet: 5, capable: true },
    { id: 'g2', side: monsters, positionFeet: 40, capable: true },
    { id: 'g3', side: monsters, positionFeet: 5, capable: false },
    { id: 'ally', side: party, positionFeet: 5, capable: true },
  ],
});
assert(JSON.stringify(ids) === JSON.stringify(['g1']), 'провокация: только дееспособный враг в 5 фт');

const none = opportunityAttackerIds({
  moverId: 'p1',
  moverSide: party,
  from: 0,
  to: 4,
  fighters: [{ id: 'g1', side: monsters, positionFeet: 5, capable: true }],
});
assert(none.length === 0, 'провокация: остался в досягаемости — нет OA');

console.log('ok: multiattack and reactions');
