import { approachOnLine, combineRollModes, hasPackTacticsAdvantage, pickD20, type IPackFighter } from '@/domain/combat';
import { bonusKindsFromTraits, CATALOG_TRAIT, hasCatalogTrait, loadCatalog } from '@/domain/monster';

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
const wolf = byKey('wolf');
const orc = byKey('orc');
const bandit = byKey('bandit');
const skeleton = byKey('skeleton');

assert(hasCatalogTrait(goblin.traits, CATALOG_TRAIT.nimble), 'гоблин: Юркий');
assert(!hasCatalogTrait(goblin.traits, CATALOG_TRAIT.aggressive), 'гоблин: нет Агрессивного');
assert(JSON.stringify(bonusKindsFromTraits(goblin.traits)) === JSON.stringify(['disengage', 'hide']), 'гоблин: бонусы');

assert(hasCatalogTrait(wolf.traits, CATALOG_TRAIT.packTactics), 'волк: Тактика стаи');
assert(hasCatalogTrait(wolf.traits, CATALOG_TRAIT.keenSenses), 'волк: Острый слух');
assert(bonusKindsFromTraits(wolf.traits).length === 0, 'волк: нет бонусных действий');

assert(hasCatalogTrait(orc.traits, CATALOG_TRAIT.aggressive), 'орк: Агрессивный');
assert(JSON.stringify(bonusKindsFromTraits(orc.traits)) === JSON.stringify(['aggressive']), 'орк: бонус');

assert(bonusKindsFromTraits(bandit.traits).length === 0, 'бандит: нет черт');
assert(bonusKindsFromTraits(skeleton.traits).length === 0, 'скелет: нет черт');

const wolfA: IPackFighter = { id: 'w1', positionFeet: 10, side: 'monsters', capable: true };
const wolfB: IPackFighter = { id: 'w2', positionFeet: 5, side: 'monsters', capable: true };
const player: IPackFighter = { id: 'p1', positionFeet: 0, side: 'party', capable: true };
const downed: IPackFighter = { id: 'w3', positionFeet: 5, side: 'monsters', capable: false };

assert(
  hasPackTacticsAdvantage({
    attackerId: 'w1',
    attackerSide: 'monsters',
    targetId: 'p1',
    targetPositionFeet: 0,
    fighters: [wolfA, wolfB, player],
  }),
  'стая: союзник в 5 фт от цели'
);

assert(
  !hasPackTacticsAdvantage({
    attackerId: 'w1',
    attackerSide: 'monsters',
    targetId: 'p1',
    targetPositionFeet: 0,
    fighters: [wolfA, player],
  }),
  'стая: один волк без союзника у цели'
);

assert(
  !hasPackTacticsAdvantage({
    attackerId: 'w1',
    attackerSide: 'monsters',
    targetId: 'p1',
    targetPositionFeet: 0,
    fighters: [wolfA, downed, player],
  }),
  'стая: недееспособный союзник не считается'
);

assert(pickD20(3, 18, 'advantage').value === 18, 'преимущество берёт больший');
assert(pickD20(3, 18, 'disadvantage').value === 3, 'помеха берёт меньший');
assert(combineRollModes(true, true) === 'normal', 'преимущество и помеха отменяют друг друга');
assert(combineRollModes(true, false) === 'advantage', 'только преимущество');

const rush = approachOnLine({ from: 40, target: 0, maxFeet: 30 });
assert(rush.movedFeet === 30, 'агрессивный: полный ход к цели');
assert(rush.positionAfter === 10, 'агрессивный: 40-30=10');
assert(rush.distanceAfter === 10, 'агрессивный: ещё не вплотную');

const already = approachOnLine({ from: 5, target: 0, maxFeet: 30 });
assert(already.movedFeet === 0, 'уже в 5 фт — нет хода');

console.log('ok: catalog traits');
