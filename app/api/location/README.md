# `/api/location`

HTTP для карты мира: дерево мест, дороги, позиция игрока, привязка NPC, осмотр.

Заголовок тел: `Content-Type: application/json`. CORS: любой origin (`GET, POST, PUT, PATCH, DELETE, OPTIONS`).

Ошибки: `{ "error": "текст" }` — `400` или `404` (если в тексте «не найден»). Успех: JSON как ниже; `DELETE` места/ребра/NPC-связи — `204` без тела.

OpenAPI: `/api-docs`. Хуки look: `GET /api/test/npc-chat/hooks?turnId=`.

---

## Общие типы

`LocationKind`: `region` | `settlement` | `district` | `building` | `room` | `dungeon` | `wilderness` | `other`

```ts
Location {
  id: string
  campaignId: string
  parentId: string | null
  kind: LocationKind
  name: string
  summary: string
  description: string
  features: string
  isSecret: boolean
  tags: string[]
}

LocationLink {
  id: string
  campaignId: string
  fromId: string
  toId: string
  days: number          // целое ≥ 1; ребро двустороннее в travel
  label: string | null
}

PlayerTravel {
  destinationId: string
  destination: Location
  route: string[]       // settlement-id после старта
  legIndex: number
  daysLeft: number
}

PlayerLocation {
  playerId: string
  location: Location | null
  travel: PlayerTravel | null
}

NpcLocation {
  npcId: string
  locationId: string
  role: string | null
  isPrimary: boolean
}

NpcAtLocation {
  npc: Npc            // как GET /api/npcs
  role: string | null
  isPrimary: boolean
}
```

---

## Каталог мест

Дерево: `parentId`. Список плоский — дерево собирает клиент.

### `GET /api/location`

Все локации кампании.

|       |                           |
| ----- | ------------------------- |
| Query | `campaignId` (обязателен) |
| 200   | `Location[]`              |

```
GET /api/location?campaignId={campaignId}
```

### `POST /api/location`

Создать место. `201`.

```
POST /api/location
Content-Type: application/json

{
  "campaignId": "string",
  "parentId": "string | null",
  "kind": "LocationKind",
  "name": "string",
  "summary": "string",
  "description": "string",
  "features": "string",
  "isSecret": false,
  "tags": ["string"]
}
```

`isSecret` можно опустить (`false`). Ответ: `Location`.

### `GET /api/location/{id}`

Одно место. `200` → `Location`.

```
GET /api/location/{id}
```

### `PATCH /api/location/{id}`

Частичное обновление (без `campaignId`). `200` → `Location`.

```
PATCH /api/location/{id}
Content-Type: application/json

{
  "parentId": "string | null",
  "kind": "LocationKind",
  "name": "string",
  "summary": "string",
  "description": "string",
  "features": "string",
  "isSecret": false,
  "tags": ["string"]
}
```

Все поля опциональны.

### `DELETE /api/location/{id}`

Удалить место. `204`.

```
DELETE /api/location/{id}
```

### `GET /api/location/{id}/children`

Прямые дети. `200` → `Location[]`.

```
GET /api/location/{id}/children
```

---

## Дороги

Связь поселений для многодневного пути. Уникальность `(fromId, toId)`.

### `GET /api/location/links`

|       |                           |
| ----- | ------------------------- |
| Query | `campaignId` (обязателен) |
| 200   | `LocationLink[]`          |

```
GET /api/location/links?campaignId={campaignId}
```

### `POST /api/location/links`

`201` → `LocationLink`. `label` необязателен.

```
POST /api/location/links
Content-Type: application/json

{
  "campaignId": "string",
  "fromId": "string",
  "toId": "string",
  "days": 1,
  "label": "string | null"
}
```

### `GET /api/location/links/{id}`

`200` → `LocationLink`.

```
GET /api/location/links/{id}
```

### `PATCH /api/location/links/{id}`

Поля опциональны. `200` → `LocationLink`.

```
PATCH /api/location/links/{id}
Content-Type: application/json

{
  "fromId": "string",
  "toId": "string",
  "days": 1,
  "label": "string | null"
}
```

### `DELETE /api/location/links/{id}`

`204`.

```
DELETE /api/location/links/{id}
```

---

## Игрок: где стоит / travel

`campaignId` берётся с игрока, в запрос не класть.

**PATCH:** то же поселение (или нет settlement) — мгновенный перенос, travel сбрасывается. Разные поселения и есть путь по `links` — старт travel, `location` не прыгает, пока отрезок не закрыт. Пути нет — `400` «Путь до цели не найден.»

### `GET /api/location/player`

|       |                         |
| ----- | ----------------------- |
| Query | `playerId` (обязателен) |
| 200   | `PlayerLocation`        |

```
GET /api/location/player?playerId={playerId}
```

### `PATCH /api/location/player`

Клик по месту на карте. `200` → `PlayerLocation`.

```
PATCH /api/location/player
Content-Type: application/json

{
  "playerId": "string",
  "locationId": "string"
}
```

### `POST /api/location/player/advance`

Списать дни пути (`days` по умолчанию `1`). `200` → `PlayerLocation`.

```
POST /api/location/player/advance
Content-Type: application/json

{
  "playerId": "string",
  "days": 1
}
```

`days` опционален, целое ≥ 1. `playerId` обязателен.

### `GET /api/location/player/npcs`

NPC в той же локации, где стоит игрок (`player.locationId`). В travel — текущее место, не destination. Нет локации — `[]`.

|       |                         |
| ----- | ----------------------- |
| Query | `playerId` (обязателен) |
| 200   | `NpcAtLocation[]`       |

```
GET /api/location/player/npcs?playerId={playerId}
```

---

## NPC ↔ место

### `GET /api/location/npcs/{npcId}`

Где «живёт» NPC. `200` → `NpcLocation[]`.

```
GET /api/location/npcs/{npcId}
```

### `PUT /api/location/npcs/{npcId}`

Привязать (upsert). `200` → `NpcLocation`.

```
PUT /api/location/npcs/{npcId}
Content-Type: application/json

{
  "locationId": "string",
  "role": "string | null",
  "isPrimary": false
}
```

`locationId` обязателен; `role`, `isPrimary` опциональны.

### `DELETE /api/location/npcs/{npcId}/{locationId}`

Отвязать. `204`.

```
DELETE /api/location/npcs/{npcId}/{locationId}
```

---

## Описание прибытия (Master)

**UI должен вызывать этот API после смены локации** (`move_player`, `advance_travel` с прибытием). Мастер описывает текущую локацию игрока.

### `POST /api/location/describe`

`200`:

```ts
{
  description: string;
  locationId: string;
  locationName: string;
}
```

```
POST /api/location/describe
Content-Type: application/json

{
  "campaignId": "string",
  "playerId": "string"
}
```

`description` можно добавить в лог чата как `{ role: 'assistant', content: description }`.

---

## Осмотр (world look) — LEGACY

**Устарело для arrival-описаний.** UI должен вызывать `POST /api/location/describe` (Мастер). Этот агент оставлен только для тестирования: каждый запрос — LLM, запись в `description`, фон-хуки.

### `POST /api/test/location`

Игрок должен уже стоять в месте (`GET/PATCH …/player`). `200`:

```ts
{
  look: string;
  locationId: string;
  turnId: string;
}
```

```
POST /api/test/location
Content-Type: application/json

{
  "campaignId": "string",
  "playerId": "string"
}
```

Статус хуков: `GET /api/test/npc-chat/hooks?turnId={turnId}`.

---

## Карта (минимум запросов)

1. `GET /api/location?campaignId=` — узлы
2. `GET /api/location/links?campaignId=` — рёбра с `days`
3. `GET /api/location/player?playerId=` — текущий узел + travel
4. Клик: `PATCH /api/location/player` `{ playerId, locationId }`
5. День пути: `POST /api/location/player/advance` `{ playerId, days }`
