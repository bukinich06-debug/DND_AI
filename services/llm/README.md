# LLM tools

Tools для агента Мастера. Контекст (`IToolContext`): всегда есть `campaignId` — в args его не передаём.

Файлы: `services/llm/tools/*Tool.ts`.

Курсы монет: `1 sp = 10 cp`, `1 ep = 50 cp`, `1 gp = 100 cp`, `1 pp = 1000 cp`.

---

## Оглавление

| name | Файл | Назначение |
|------|------|------------|
| `roll_dice` | `tools/rollDiceTool.ts` | Бросок кубика |
| `get_coins` | `tools/getCoinsTool.ts` | Баланс монет |
| `transfer_coins` | `tools/transferCoinsTool.ts` | Перевод монет (покупка / лут) |
| `search_player_items` | `tools/searchPlayerItemsTool.ts` | Инвентарь / поиск предмета |
| `get_player_proficiencies` | `tools/getPlayerProficienciesTool.ts` | Навыки и владения |
| `get_player_conditions` | `tools/getPlayerConditionsTool.ts` | Активные состояния |
| `add_player_condition` | `tools/addPlayerConditionTool.ts` | Наложить состояние |
| `remove_player_condition` | `tools/removePlayerConditionTool.ts` | Снять состояние |
| `get_player_location` | `tools/getPlayerLocationTool.ts` | Текущая локация / travel |
| `move_player` | `tools/movePlayerTool.ts` | Мгновенное перемещение |
| `start_travel` | `tools/startTravelTool.ts` | Начать путешествие |
| `advance_travel` | `tools/advanceTravelTool.ts` | Продвинуть путь на дни |
| `get_npc_relation` | `tools/getNpcRelationTool.ts` | Отношение NPC к игроку |
| `improve_npc_relation` | `tools/improveNpcRelationTool.ts` | Улучшить отношение (reason→delta) |
| `worsen_npc_relation` | `tools/worsenNpcRelationTool.ts` | Ухудшить отношение (reason→delta) |
| `list_npc_memories` | `tools/listNpcMemoriesTool.ts` | Воспоминания NPC |
| `add_npc_memory` | `tools/addNpcMemoryTool.ts` | Добавить воспоминание |
| `list_npc_knowledge` | `tools/listNpcKnowledgeTool.ts` | Знания NPC (open/check) |
| `get_npc_knowledge` | `tools/getNpcKnowledgeTool.ts` | Одно знание NPC |

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

Без `query` — весь инвентарь. С `query` — кандидаты: инструменты PHB матчятся по стандартным именам (en/ru); уникальные/магические — по `name`/`description`, эффект бери из `description`/`properties`.

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
    id, name, kind, quantity, description, properties, isMagical, toolKey?
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

**Return** — массив `{ id, npcId, playerId, summary, kind, importance }`.

---

## `add_npc_memory`

Добавить воспоминание без смены score. Для смены отношения — `improve`/`worsen`.

**Args**

| Параметр | Тип | Обяз. | Описание |
|----------|-----|-------|----------|
| `npcId` | string | да | ID NPC |
| `summary` | string | да | Факт |
| `kind` | `episode\|fact\|favor\|grievance\|promise` | да | Тип |
| `playerId` | string | нет | Если о конкретном PC |
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

## Как добавлять tool

1. `services/llm/tools/<name>Tool.ts` — объект `ILlmTool`
2. Строка в оглавлении и секция в этом README
