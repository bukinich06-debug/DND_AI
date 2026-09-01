# LLM tools

Tools для агента Мастера. Контекст (`IToolContext`): всегда есть `campaignId` — в args его не передаём.

Файлы: `services/llm/tools/*Tool.ts`.

Курсы монет: `1 sp = 10 cp`, `1 ep = 50 cp`, `1 gp = 100 cp`, `1 pp = 1000 cp`.

Диалог NPC: registry [`npcTools.ts`](../npc/npcTools.ts). World look: [`../world/describeLocation.ts`](../world/describeLocation.ts) (без tools, HTTP `POST /api/test/location`). Post-hooks: [`../hooks/README.md`](../hooks/README.md).

---

## Оглавление

### Диалог (`npcTools.ts`)

| name | Файл | Назначение |
|------|------|------------|
| `roll_dice` | `rollDiceTool.ts` | Бросок кубика |
| `get_coins` | `getCoinsTool.ts` | Баланс монет |
| `transfer_coins` | `transferCoinsTool.ts` | Перевод монет (покупка / лут) |
| `search_player_items` | `searchPlayerItemsTool.ts` | Инвентарь / поиск предмета |
| `get_player_proficiencies` | `getPlayerProficienciesTool.ts` | Навыки и владения |
| `get_player_conditions` | `getPlayerConditionsTool.ts` | Активные состояния |
| `add_player_condition` | `addPlayerConditionTool.ts` | Наложить состояние |
| `remove_player_condition` | `removePlayerConditionTool.ts` | Снять состояние |
| `get_player_location` | `getPlayerLocationTool.ts` | Текущая локация / travel |
| `move_player` | `movePlayerTool.ts` | Мгновенное перемещение |
| `start_travel` | `startTravelTool.ts` | Начать путешествие |
| `advance_travel` | `advanceTravelTool.ts` | Продвинуть путь на дни |
| `get_npc_relation` | `getNpcRelationTool.ts` | Отношение NPC к игроку |
| `improve_npc_relation` | `improveNpcRelationTool.ts` | Улучшить отношение (reason→delta) |
| `worsen_npc_relation` | `worsenNpcRelationTool.ts` | Ухудшить отношение (reason→delta) |
| `list_npc_memories` | `listNpcMemoriesTool.ts` | Воспоминания NPC |
| `add_npc_memory` | `addNpcMemoryTool.ts` | Добавить воспоминание |
| `list_npc_knowledge` | `listNpcKnowledgeTool.ts` | Знания NPC (open/check) |
| `get_npc_knowledge` | `getNpcKnowledgeTool.ts` | Одно знание NPC |

### World look (`describeLocation.ts`)

Нет tool loop. Каждый запрос — один вызов модели → persist `description` → post-hooks.

Отличие world-хуков от NPC: нет speaker; create NPC сажает в текущую локацию (`ctx.locationId`); нет acquaintance / `ensure_location_link`. HTTP: `POST /api/test/location`.

### Post-hook

NPC: [`mentionTools.ts`](../hooks/npc/mentionTools.ts), [`mentionLocationTools.ts`](../hooks/location/mentionLocationTools.ts). World: [`worldNpcTools.ts`](../hooks/world/worldNpcTools.ts), [`worldLocationTools.ts`](../hooks/world/worldLocationTools.ts) — без `ensure_npc_acquaintance` / `ensure_location_link`; create NPC сажает в `ctx.locationId`. В диалог **не** входят. Поток: [hooks README](../hooks/README.md).

| name | Файл | Назначение |
|------|------|------------|
| `search_npc` | `searchNpcTool.ts` | Поиск NPC |
| `ensure_npc_acquaintance` | `ensureNpcAcquaintanceTool.ts` | Знакомство NPC↔NPC |
| `create_mentioned_npc` | `createMentionedNpcTool.ts` | Stub NPC из упоминания |
| `update_mentioned_npc` | `updateMentionedNpcTool.ts` | Update stub / знакомого |
| `search_location` | `searchLocationTool.ts` | Поиск локации |
| `create_mentioned_location` | `createMentionedLocationTool.ts` | Stub локации из упоминания |
| `update_mentioned_location` | `updateMentionedLocationTool.ts` | Update stub / известного места |
| `ensure_location_link` | `ensureLocationLinkTool.ts` | Дорога settlement↔settlement |

---

## `roll_dice`

Бросает один кубик D&D и сохраняет результат.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `die` | `d4\|d6\|d8\|d10\|d12\|d20\|d100` | да | Тип кубика |
| `note` | string | нет | Зачем бросок |
| `playerId` | string | нет | PC (не вместе с `npcId`) |
| `npcId` | string | нет | NPC (не вместе с `playerId`) |

Без `playerId`/`npcId` — бросок Мастера.

**Return**

```ts
{ id, campaignId, die, value, note, playerId, npcId, rolledAt }
```

---

## `get_coins`

Баланс владельца. Перед покупкой / лутом.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `kind` | `player\|npc\|item` | да | Тип владельца |
| `id` | string | да | ID владельца |

**Return**

```ts
{
  owner: { kind, id },
  coinsCp: number,
  coins: { pp, gp, ep, sp, cp }
}
```

---

## `transfer_coins`

Перевод монет. Покупка: `player → npc|item` после `get_coins`. Лут: `npc|item → player`; «всё» = `amountCp` из `get_coins.coinsCp`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `fromKind` | `player\|npc\|item` | да | Отправитель |
| `fromId` | string | да | ID отправителя |
| `toKind` | `player\|npc\|item` | да | Получатель |
| `toId` | string | да | ID получателя |
| `amountCp` | integer | да | Сумма в медных |

**Return**

```ts
{
  amountCp: number,
  from: { owner, coinsCp, coins },
  to: { owner, coinsCp, coins }
}
```

Ошибки: недостаточно монет, владелец не найден / не из кампании.

---

## `search_player_items`

Инвентарь игрока или поиск предмета. Перед использованием предмета / инструмента.

Без `query` — весь инвентарь. С `query` — кандидаты: инструменты PHB матчятся по стандартным именам (en/ru); уникальные/магические — по `name`/`description`, эффект бери из `description` и `properties` (массив `{ type, text, … }`: `damage`, `range`, `ac`, `heal`, `twoHanded`, `note`). `equipSlot`: `null` — в сумке; `armor` — надет доспех; `mainHand` / `offHand` — в руках.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |
| `query` | string | нет | Поисковый запрос |

**Return**

```ts
{
  playerId: string,
  query: string | null,
  exact: boolean,
  items: Array<{
    id, name, kind, quantity, description, properties, isMagical, equipSlot, toolKey?
  }>
}
```

---

## `get_player_proficiencies`

Владения игрока. Для thieves' tools смотри `toolProf` (`thievesTools`), не skill. Обычно вместе с `search_player_items`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |

**Return**

```ts
{
  playerId: string,
  proficiencyBonus: number,
  skillProf: string[],
  skillExpertise: string[],
  toolProf: string[],
  weaponProf: string[],
  armorProf: string[]
}
```

---

## `get_player_conditions`

Активные состояния PHB 2024 и уровень истощения. Перед действием (идти / атаковать / говорить). «Сон» = `unconscious`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |

**Return**

```ts
{
  playerId: string,
  conditions: string[],
  exhaustionLevel: number,
  rules: Record<string, string>
}
```

---

## `add_player_condition`

Наложить состояние. Для exhaustion без `exhaustionLevel` — +1; с ним — установить уровень (0–6).

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |
| `condition` | string | да | Ключ или имя (en/ru) |
| `exhaustionLevel` | integer | нет | Уровень истощения |

**Return** — как у `get_player_conditions`.

---

## `remove_player_condition`

Снять состояние. Для exhaustion без `exhaustionLevel` — −1; с ним — установить уровень.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |
| `condition` | string | да | Ключ или имя |
| `exhaustionLevel` | integer | нет | Уровень истощения |

**Return** — как у `get_player_conditions`.

---

## `get_player_location`

Текущая локация игрока и состояние путешествия (`travel: null` — не в пути).

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |

**Return**

```ts
{
  playerId: string
  location: Location | null
  travel: null | {
    destinationId: string
    destination: Location
    route: string[]
    legIndex: number
    daysLeft: number
  }
}
```

---

## `move_player`

Мгновенно переместить в локацию. Сбрасывает travel. Для дальних путей — `start_travel`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |
| `locationId` | string | да | ID локации |

**Return** — как у `get_player_location`.

---

## `start_travel`

Начать путь к цели по `LocationLink`. Нужна текущая локация и существующий маршрут.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |
| `destinationId` | string | да | ID цели |

**Return** — как у `get_player_location`.

---

## `advance_travel`

Продвинуть активное путешествие на N дней (по умолчанию 1). При завершении последнего отрезка — прибытие.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `playerId` | string | да | ID игрока |
| `days` | integer | нет | Дней пути (минимум 1) |

**Return** — как у `get_player_location`.

---

## `get_npc_relation`

Отношение NPC к игроку. Нет записи → `score: 0`, `stance: neutral`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC |
| `playerId` | string | да | ID игрока |

**Return**

```ts
{ npcId, playerId, score, note, stance }
```

`stance`: `hostile` \| `cold` \| `neutral` \| `warm` \| `devoted`.

---

## `improve_npc_relation`

Улучшить отношение. Цифру считает domain по `reason`; пишется memory.

| reason | delta | memory kind | importance |
|--------|------:|-------------|------------|
| `compliment` | +5 | favor | 2 |
| `help` | +20 | favor | 3 |
| `save` | +50 | favor | 5 |

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC |
| `playerId` | string | да | ID игрока |
| `reason` | `compliment\|help\|save` | да | Тип поступка |
| `summary` | string | да | Что сделал игрок |

**Return**

```ts
{ relation, stance, delta, memory }
```

---

## `worsen_npc_relation`

Ухудшить отношение. Как `improve_npc_relation`, но негативные reasons.

| reason | delta | memory kind | importance |
|--------|------:|-------------|------------|
| `insult` | −10 | grievance | 2 |
| `threat` | −25 | grievance | 3 |
| `attack` | −50 | grievance | 5 |

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC |
| `playerId` | string | да | ID игрока |
| `reason` | `insult\|threat\|attack` | да | Тип поступка |
| `summary` | string | да | Чем обидел игрок |

**Return** — как у `improve_npc_relation`.

---

## `list_npc_memories`

Воспоминания NPC. Сортировка: importance desc, id asc.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC |
| `playerId` | string | нет | Фильтр по игроку |
| `minImportance` | integer 1…5 | нет | Минимальная важность |

**Return** — массив `{ id, npcId, playerId, aboutNpcId, summary, kind, importance }`.

---

## `add_npc_memory`

Добавить воспоминание без смены score. Для смены отношения — `improve`/`worsen`.  
`summary` самодостаточный (кто + что). Факт о другом NPC — `aboutNpcId`, `playerId` null. `playerId` — только если память о игроке.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC (владелец) |
| `summary` | string | да | Факт с явным субъектом |
| `kind` | `episode\|fact\|favor\|grievance\|promise` | да | Тип |
| `playerId` | string | нет | Только если о PC |
| `aboutNpcId` | string | нет | ID другого NPC, о ком факт |
| `importance` | integer 1…5 | нет | По умолчанию 3 |

**Return** — объект memory.

---

## `list_npc_knowledge`

Знания NPC. По умолчанию `reveal=open`. `check` — без `content`. `hidden` недоступны.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC |
| `reveal` | `open\|check` | нет | По умолчанию `open` |

**Return** — массив знаний (`content` null для `check`).

---

## `get_npc_knowledge`

Одно знание по id. `open` — полный текст; `check` — без content; `hidden` — ошибка.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `knowledgeId` | string | да | ID знания |

**Return** — знание (возможно `content: null`).

---

## `search_npc`

Post-hook ([hooks README](../hooks/README.md)). Поиск NPC в кампании по имени. Приоритет — знакомые speaker (`ctx.npcId`).

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `name` | string | да | Имя или часть имени |

**Return** — массив `{ id, name, title, knownBySpeaker }`.

---

## `ensure_npc_acquaintance`

Post-hook ([hooks README](../hooks/README.md)). Upsert «speaker (`ctx.npcId`) знает otherNpc».

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `otherNpcId` | string | да | ID знакомого NPC |
| `note` | string | нет | Как знакомы |

**Return** — запись acquaintance.

---

## `create_mentioned_npc`

Post-hook ([hooks README](../hooks/README.md)). Stub NPC из упоминания. Только для **нового** человека: сначала `search_npc` (и acquaintances, если есть speaker); уточнения → `update_mentioned_npc`. Без личного имени: `title`=роль, provisional `name`. Stub-поля без значения → `"неизвестно"`.

- Есть `ctx.npcId` (NPC-чат) — двустороннее acquaintance + optional memory (`aboutNpcId` = новый NPC, `playerId` null). `dmNotes` = `auto:mentioned-by:{speakerId}`.
- Нет speaker (world look) — без acquaintance/memory. `dmNotes` = `auto:described-at:{locationId}` или `auto:mentioned`.
- Есть `ctx.locationId` — `setNpcLocation` (`isPrimary: true`, `role` из `title` если есть).

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `name` | string | да | Личное или provisional имя |
| `appearance` | string | нет | Внешность (дефолт `неизвестно`) |
| `personality` | string | нет | Характер (дефолт `неизвестно`) |
| `speech` | string | нет | Речь (дефолт `неизвестно`) |
| `habits` | string | нет | Привычки (дефолт `неизвестно`) |
| `title` | string | нет | Титул / роль |
| `memory` | string | нет | Факт о нём (с именем/ролью в тексте). Только со speaker |
| `note` | string | нет | Как знакомы. Только со speaker |

**Return** — `{ npc, acquaintance, memory, location }`. `acquaintance` / `memory` / `location` могут быть `null`.

---

## `update_mentioned_npc`

Post-hook ([hooks README](../hooks/README.md)). Partial update уже известного NPC.

- Есть `ctx.npcId` (NPC-чат) — карточка + optional note/memory (`aboutNpcId` = этот NPC, `playerId` null) + reverse acquaintance (other → speaker).
- Нет speaker (world look) — только патч карточки; `acquaintance` и `memory` = `null`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID уже известного NPC |
| `name` | string | нет | Новое имя |
| `title` | string | нет | Титул / роль |
| `appearance` | string | нет | Внешность |
| `personality` | string | нет | Характер |
| `speech` | string | нет | Речь |
| `habits` | string | нет | Привычки |
| `memory` | string | нет | Факт о нём (с именем/ролью в тексте). Только со speaker |
| `note` | string | нет | Как знакомы (ensure acquaintance). Только со speaker |

**Return** — `{ npc, acquaintance, memory }`. Нужно хотя бы одно optional-поле. Без speaker `acquaintance`/`memory` = `null`.

---

## `search_location`

Post-hook ([hooks README](../hooks/README.md)). Ищет локацию в кампании по имени (`contains`, без регистра) или точному тегу. Ближе к текущей локации игрока — выше в списке.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `name` | string | да | Название / часть / тег |

**Return** — массив `{ id, name, kind, parentId, tags, summary }`.

---

## `create_mentioned_location`

Post-hook ([hooks README](../hooks/README.md)). Stub локации. **`parentId` ставит сервер** (не передавать): здание → текущее поселение или `containerId`; поселение → тот же родитель, что у текущей деревни, плюс `LocationLink`. Пустые поля → `"неизвестно"`. Тег `auto:mentioned-by:{speakerId}`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `name` | string | да | Как назвали место |
| `kind` | LocationKind | да | `building` / `settlement` / `room` / … |
| `containerId` | string | нет | Уже найденный контейнер (деревня Б для кузни в Б) |
| `tags` | string[] | нет | Роли-синонимы (`smithy`, `кузница`) |
| `days` | number | нет | Дни пути для нового поселения (дефолт 1) |
| `summary` | string | нет | Кратко (дефолт `неизвестно`) |
| `description` | string | нет | Описание (дефолт `неизвестно`) |
| `features` | string | нет | Особенности (дефолт `неизвестно`) |

**Return** — `{ location, link }`. `link` не null, если создали settlement и есть текущее поселение.

---

## `update_mentioned_location`

Post-hook ([hooks README](../hooks/README.md)). Partial update известной локации. `tags` сливаются с существующими.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `locationId` | string | да | ID локации |
| `name` | string | нет | Новое название |
| `summary` | string | нет | Краткое описание |
| `description` | string | нет | Описание |
| `tags` | string[] | нет | Добавить теги |

**Return** — обновлённая локация. Нужно хотя бы одно optional-поле.

---

## `ensure_location_link`

Post-hook ([hooks README](../hooks/README.md)). Upsert дороги между двумя **settlement**. Если ребро уже есть в любую сторону — возвращает его. `days` по умолчанию 1.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `fromId` | string | да | ID поселения |
| `toId` | string | да | ID другого поселения |
| `days` | number | нет | Дни пути (дефолт 1) |
| `label` | string | нет | Подпись |

**Return** — запись `LocationLink`.

---

## Как добавлять tool

1. `services/llm/tools/<name>Tool.ts` — объект `ILlmTool`
2. Диалог → строка в `npcTools.ts`. Только хук → registry в `hooks/`
3. Строка в оглавлении и секция в этом README
