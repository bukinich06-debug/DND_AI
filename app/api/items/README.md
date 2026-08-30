# `/api/items`

HTTP для предметов: каталог кампании, инвентарь игрока, CRUD, экипировка.

Заголовок тел: `Content-Type: application/json`. CORS: любой origin (`GET, POST, PUT, PATCH, DELETE, OPTIONS`).

Ошибки: `{ "error": "текст" }` — `400` или `404` (если в тексте «не найден»). Успех: JSON как ниже; `DELETE` — `204` без тела.

OpenAPI: `/api-docs`.

---

## Общие типы

`ItemKind`: `weapon` | `armor` | `shield` | `tool` | `gear` | `consumable` | `treasure` | `key` | `junk` | `other`

`ItemRarity`: `common` | `uncommon` | `rare` | `veryRare` | `legendary` | `artifact`

`EquipSlot`: `armor` | `mainHand` | `offHand`

Владелец ровно один: `playerId` **или** `npcId` **или** `locationId` (остальные `null`). Без владельца можно.

`equipSlot: null` — в сумке (или не у игрока). Слот только у предмета игрока.

Щит — это `kind: shield`, слот руки (`mainHand` / `offHand`), не `armor`.

`ItemPropType`: `damage` | `range` | `ac` | `heal` | `twoHanded` | `stealthDisadvantage` | `mastery` | `note`

`WeaponMastery`: `cleave` | `graze` | `nick` | `push` | `sap` | `slow` | `topple` | `vex`

У каждого свойства обязательный `text` (строка для UI), кроме `mastery` на входе: достаточно `mastery`, `text` подставится из справочника.

```ts
Item {
  id: string
  campaignId: string
  name: string
  kind: ItemKind
  rarity: ItemRarity | null
  description: string
  weight: number | null
  valueCp: number | null      // стоимость в медных
  coinsCp: number
  quantity: number            // ≥ 1
  isMagical: boolean
  properties: IItemProp[] | null
  equipSlot: EquipSlot | null
  playerId: string | null
  npcId: string | null
  locationId: string | null
}

IItemProp =
  | { type: 'damage'; text: string; dice: string; damageType?: string }
  | { type: 'range'; text: string; normal: number; long?: number }
  | { type: 'ac'; text: string; base: number; addDex: boolean }
  | { type: 'heal'; text: string; dice: string }
  | { type: 'twoHanded'; text: string }
  | { type: 'stealthDisadvantage'; text: string }
  | { type: 'mastery'; text: string; mastery: WeaponMastery }
  | { type: 'note'; text: string }

EquipItemResult {
  item: Item
  unequipped: Item[]
}
```

---

## Список и создание

### `GET /api/items`

Ровно один query: кампания **или** игрок.

| | |
|--|--|
| Query | `campaignId` **или** `playerId` |
| 200 | `Item[]` |

```
GET /api/items?campaignId={campaignId}
GET /api/items?playerId={playerId}
```

Оба сразу или ни одного — `400`. Нет игрока — `404`.

### `POST /api/items`

Создать предмет. `201` → `Item`.

```
POST /api/items
Content-Type: application/json

{
  "campaignId": "string",
  "name": "string",
  "kind": "ItemKind",
  "description": "string",
  "rarity": "ItemRarity | null",
  "weight": "number | null",
  "valueCp": "number | null",
  "properties": [],
  "playerId": "string | null",
  "npcId": "string | null",
  "locationId": "string | null",
  "coinsCp": 0,
  "quantity": 1,
  "isMagical": false,
  "equipSlot": "EquipSlot | null"
}
```

`coinsCp` / `quantity` / `isMagical` / `equipSlot` можно опустить (`0` / `1` / `false` / `null`). Владелец должен быть из той же кампании. Слот при создании: если занят — `400` (без автоснятия). Стопку (`quantity > 1`) экипировать нельзя.

### `POST /api/items/grant`

Выдать игроку шаблон из справочника (`key` как в `domain/item/catalog/data`, например `dagger`). Кампания — у игрока. Предмет в сумке (`equipSlot: null`). Новая строка, стопки не сливаются. `201` → `Item`. Нет игрока или ключа — `404`.

```
POST /api/items/grant
Content-Type: application/json

{ "playerId": "string", "key": "dagger", "quantity": 1 }
```

`quantity` можно опустить (`1`).

---

## Один предмет

### `GET /api/items/{id}`

`200` → `Item`.

```
GET /api/items/{id}
```

### `PATCH /api/items/{id}`

Частичное обновление (без `campaignId`). `200` → `Item`.

```
PATCH /api/items/{id}
Content-Type: application/json

{
  "name": "string",
  "kind": "ItemKind",
  "rarity": "ItemRarity | null",
  "description": "string",
  "weight": "number | null",
  "valueCp": "number | null",
  "coinsCp": 0,
  "quantity": 1,
  "isMagical": false,
  "properties": [],
  "equipSlot": "EquipSlot | null",
  "playerId": "string | null",
  "npcId": "string | null",
  "locationId": "string | null"
}
```

Смена владельца: не игрок — `equipSlot` сбрасывается. Конфликт слота — `400` (без автоснятия). Для «снять старое, надеть новое» — `POST /equip`.

### `DELETE /api/items/{id}`

`204`.

```
DELETE /api/items/{id}
```

---

## Экипировка

Слот в теле явный. Какую руку выбрать — решает клиент.

Правила слота:

- `armor` — только `kind: armor`; один доспех
- `mainHand` / `offHand` — только `weapon` или `shield`
- `{ type: 'twoHanded', … }` в `properties` — только `mainHand`, обе руки

### `POST /api/items/equip`

Надеть. Если слот (или руки при двуручном) занят — предыдущее в сумку, новое в слот. `200` → `EquipItemResult`.

```
POST /api/items/equip
Content-Type: application/json

{
  "itemId": "string",
  "slot": "EquipSlot"
}
```

Не игрок / неверный kind / стопка / неизвестный слот — `400`. Нет предмета — `404`.

### `POST /api/items/unequip`

Снять в сумку (`equipSlot: null`). Уже в сумке — тот же `Item`. `200` → `Item`.

```
POST /api/items/unequip
Content-Type: application/json

{
  "itemId": "string"
}
```

Не предмет игрока — `400`. Нет предмета — `404`.
