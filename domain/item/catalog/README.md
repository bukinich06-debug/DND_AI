# Справочник предметов

JSON в `data/` — шаблоны PHB, не экземпляры кампании. Загрузка валидирует весь каталог; невалидный файл ломает импорт.

Пиши только в файлы `data/*.json`. Не добавляй поля «на будущее».

## Файлы

Корень каждого файла — **массив объектов**. Не объект `{ "items": [...] }`.

| Файл | `kind` каждой записи |
|------|----------------------|
| `weapon.json` | `weapon` |
| `armor.json` | `armor` |
| `shield.json` | `shield` |
| `consumable.json` | `consumable` |
| `gear.json` | `gear` |
| `tool.json` | `tool` |

`kind` **обязан** совпадать с файлом. Кольчугу в `weapon.json` класть нельзя.

Нет файлов для `treasure` / `key` / `junk` / `other` — не создавай их без задачи.

## Запрещённые поля

Нельзя (это поля экземпляра в БД, не шаблона):

`id`, `campaignId`, `playerId`, `npcId`, `locationId`, `equipSlot`, `coinsCp`, `quantity`

Любое другое неизвестное поле — ошибка валидации.

## Разрешённые поля (все обязательны)

| Поле | Тип | Правила |
|------|-----|---------|
| `key` | string | Уникален **во всём** каталоге. Только латиница: начинается с маленькой буквы, дальше буквы и цифры, **без** пробелов, дефисов, подчёркиваний. Примеры: `shortsword`, `leatherArmor`, `potionOfHealing`. |
| `aliases` | string[] | Непустой. Минимум английское имя и русское (`"short sword"`, `"короткий меч"`). Без пустых строк. |
| `name` | string | Непустой. **Русский.** Короткое имя для UI. |
| `kind` | string | Ровно как имя файла (см. таблицу). |
| `rarity` | string \| null | `null` для обычного снаряжения. Иначе только: `common`, `uncommon`, `rare`, `veryRare`, `legendary`, `artifact`. |
| `description` | string | Непустой. **Русский.** Одно-два предложения, без копипаста PHB. |
| `weight` | number \| null | Фунты, ≥ 0, или `null`. |
| `valueCp` | integer \| null | Стоимость в **медных** (≥ 0). `1 gp = 100 cp`, `1 sp = 10 cp`. Или `null`. |
| `isMagical` | boolean | Зелья и магия — `true`. Обычный меч — `false`. |
| `properties` | array \| null | `null`, если нет механики. Иначе массив объектов свойств (ниже). Не `{}`. |

## `properties`

Каждый элемент — объект с обязательным `type`. У всех типов, кроме `mastery` в JSON каталога, обязателен непустой `text` (**русский**, коротко). Лишние поля у свойства не клади.

Только эти `type`:

| `type` | Обязательные поля кроме `text` | Когда |
|--------|-------------------------------|--------|
| `damage` | `dice` (строка, напр. `"1d6"`). `damageType` по желанию: строка (`piercing`, `slashing`, `bludgeoning`, …) | Оружие |
| `range` | `normal` (число ≥ 0). `long` по желанию (число ≥ 0) | Дальнобойное |
| `ac` | `base` (число ≥ 0), `addDex` (boolean) | Доспех |
| `heal` | `dice` (строка, напр. `"2d4+2"`) | Зелья и лечение |
| `twoHanded` | только `text` | Двуручное оружие |
| `stealthDisadvantage` | только `text` | Тяжёлый доспех и т.п. |
| `mastery` | `mastery`: `cleave` \| `graze` \| `nick` \| `push` \| `sap` \| `slow` \| `topple` \| `vex`. В JSON каталога `text` не пиши — подставится из справочника | Оружие 2024 |
| `note` | только `text` | Лёгкое, фехтовальное, +2 КД щита, владение инструментом |

Оружие ближнего боя: как минимум `damage`. Лук: `damage` + `range` + при двуручности `twoHanded`. Доспех: `ac`. Щит: `note` про +2 КД, не `ac`.

## Язык

`name`, `description`, `text` у свойств — **русский**. Английский — в `key` и в `aliases`.

## Не делать

- Не выдумывать кубы и цены «примерно». Статы — PHB 2024 / SRD.
- Не вставлять длинные цитаты из книги.
- Не дублировать один предмет в двух файлах.
- Не менять `key` уже существующей записи (на него будут ссылаться).
- Не добавлять магические уникальные артефакты кампании сюда — это не шаблон PHB.

## Пример (фрагмент `weapon.json`)

```json
{
  "key": "shortsword",
  "aliases": ["shortsword", "short sword", "короткий меч"],
  "name": "Короткий меч",
  "kind": "weapon",
  "rarity": null,
  "description": "Лёгкое одноручное оружие ближнего боя.",
  "weight": 2,
  "valueCp": 1000,
  "isMagical": false,
  "properties": [
    { "type": "damage", "text": "1d6 колющий", "dice": "1d6", "damageType": "piercing" },
    { "type": "note", "text": "Лёгкое, фехтовальное." }
  ]
}
```

## Пример доспеха (`armor.json`)

```json
{
  "key": "leatherArmor",
  "aliases": ["leather armor", "leather", "кожаный доспех", "кожанка"],
  "name": "Кожаный доспех",
  "kind": "armor",
  "rarity": null,
  "description": "Лёгкий доспех.",
  "weight": 10,
  "valueCp": 1000,
  "isMagical": false,
  "properties": [{ "type": "ac", "text": "КД 11 + Ловкость", "base": 11, "addDex": true }]
}
```

Поиск из кода: `searchItemCatalog(query)` из `@/domain/item`. Пустой `query` — весь справочник.
