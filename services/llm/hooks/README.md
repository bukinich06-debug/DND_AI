# LLM hooks

Post-hooks после ответа агента. Идут в фоне. Следующий запрос с тем же lock-ключом ждёт завершения предыдущего хука (in-memory lock, timeout 90s).

- NPC-чат: `chatHookKey(campaignId, npcId, playerId)`
- World look: `worldHookKey(campaignId, playerId, locationId)` = `campaignId:world:playerId:locationId`

Контракты tools: [`../tools/README.md`](../tools/README.md).

---

## Карта файлов

| Что | Путь |
|-----|------|
| Триггер NPC | `services/llm/npc/chatWithNpc.ts` |
| Триггер world | `services/llm/world/describeLocation.ts` |
| Запуск очереди | `runAfterAgent.ts` |
| Lock | `store/hookLock.ts` |
| Лог / `turnId` | `store/hookLogStore.ts` |
| Контекст | `types.ts` (`IHookContext`, `IAgentHook`, `source`) |
| Места (NPC) | `location/resolveMentionedLocations.ts` |
| Люди (NPC) | `npc/resolveMentionedNpcs.ts` |
| Места (world) | `world/resolveWorldLocations.ts` |
| Люди (world) | `world/resolveWorldNpcs.ts` |
| HTTP | `POST /api/test/npc-chat`, `POST /api/test/location`, статус `GET /api/test/npc-chat/hooks?turnId=` |
| Тест UI | `/npc-chat` (hooks слева, чат, tools справа) |

---

## Порядок (`chatWithNpc`)

1. `waitForHooks(chatKey)`
2. Tool loop диалога (`npcTools.ts` — хуки сюда не входят)
3. `createTurn` → `turnId` в ответе
4. `runAfterAgent` **последовательно**: `resolveMentionedLocations`, затем `resolveMentionedNpcs`

Preload чата: character, relation, собственные memories, **about-me** (memories других NPC с `aboutNpcId` = этот NPC), acquaintances, open knowledge.

**Request**

```ts
{
  campaignId: string
  npcId: string
  playerId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}
```

**Response**

```ts
{
  say: string
  do: string | null
  toolCalls: Array<{
    name: string
    args: unknown
    ok: boolean
    result?: unknown
    error?: string
  }>
  turnId: string
}
```

`do` — только важное наблюдаемое действие; иначе `null`. В историю ассистента кладётся `say`.  
`toolCalls` — вызовы **диалога** за этот send (пустой массив, если tools не нужны).  
`turnId` — poll `GET /api/test/npc-chat/hooks?turnId=` → `{ hooks: [{ turnId, name, status, toolCalls, error? }] }` (`running` | `done` | `failed`).

### `IHookContext`

Всегда: `campaignId`, `playerId`, `reply` (`say`/`do`), `messages`, `playerName`, `turnId`, `source` (`npc` | `world`).

NPC: `npcId`, `speakerName`. World: `locationId`, без speaker.

---

## `resolveMentionedLocations`

После ответа NPC отдельный LLM-pass смотрит `say`/`do`, хвост диалога (6 сообщений) и снимок мест. До 5 раундов; финал без tool calls: `DONE`.

Preload: `location/helpers/loadLocationMentionContext.ts` → `chain` / `here` / `neighbors` / `roads` / `currentSettlementId` / `currentBuildingId`.

1. Уточнение к уже известному месту → [`update_mentioned_location`](../tools/README.md#update_mentioned_location)
2. Нет в списках → [`search_location`](../tools/README.md#search_location) → найден: при необходимости [`ensure_location_link`](../tools/README.md#ensure_location_link); нет: [`create_mentioned_location`](../tools/README.md#create_mentioned_location) (stub, `parentId` ставит сервер)
3. Новое поселение → stub + дорога от текущего settlement (`days` из фразы, иначе 1)
4. «Кузня в деревне Б» → сначала поселение Б, затем building с `containerId`

Registry: `location/mentionLocationTools.ts`. Идёт **перед** `resolveMentionedNpcs`.

---

## `resolveMentionedNpcs`

После ответа NPC отдельный LLM-pass смотрит `say`/`do`, хвост диалога (6 сообщений) и preload знакомых speaker’а (`listNpcAcquaintancesDetailed`). До 5 раундов; финал: `DONE`.

1. Уточнение к уже знакомому (роль → имя и т.п.) → [`update_mentioned_npc`](../tools/README.md#update_mentioned_npc)
2. Новое имя → [`search_npc`](../tools/README.md#search_npc) → найден: [`ensure_npc_acquaintance`](../tools/README.md#ensure_npc_acquaintance); нет: [`create_mentioned_npc`](../tools/README.md#create_mentioned_npc) (stub + двустороннее acquaintance + optional memory)
3. Роль без личного имени и нет match → create с provisional name (`Муж <speaker>`) + `title`

Registry: `npc/mentionTools.ts`.

---

## World-агент (`describeLocation`)

Игрок осматривается. Каждый запрос — один LLM-вызов без tools, сразу `updateLocation({ description: look })`, затем фоном хуки.

Look по `kind` (`lookCast`):

- **people** (`building` / `room` / `dungeon` / `wilderness` / `other`) — каждый NPC из `npcsHere` в тексте, с занятием из title/role/habits.
- **places** (`settlement` / `district` / `region`) — не именные NPC; дочерние места + массовка.

1. `waitForHooks(worldHookKey)`
2. LLM look → persist `description`
3. `createTurn` → `turnId` в ответе
4. `runAfterAgent` **последовательно**: `resolveWorldLocations`, затем `resolveWorldNpcs`

В хуки: `source: 'world'`, `locationId`, `reply.say = look`, `reply.do = null`, `messages: []`. Speaker нет. Новые NPC сажаются в текущую локацию.

HTTP: `POST /api/test/location`. Poll хуков — тот же `GET /api/test/npc-chat/hooks?turnId=`.

**Request**

```ts
{
  campaignId: string
  playerId: string
}
```

**Response**

```ts
{
  look: string
  locationId: string
  turnId: string
}
```

---

## `resolveWorldLocations`

После look отдельный LLM-pass смотрит текст и снимок **текущей** локации. До 5 раундов; финал: `DONE`.

Preload: `world/helpers/loadWorldHookContext.ts` → `current` / `parent` / `children` (без секретов) / `currentLocationId`.

1. Уточнение к ребёнку или родителю → [`update_mentioned_location`](../tools/README.md#update_mentioned_location). **Не** затирать `description` текущей локации (look уже записан)
2. Нет в списках → [`search_location`](../tools/README.md#search_location) → нет: [`create_mentioned_location`](../tools/README.md#create_mentioned_location). **Без** `ensure_location_link`
3. Комната / закуток → `kind=room` (сервер — child текущего здания). Не плодить соседние поселения из осмотра таверны

Registry: `world/worldLocationTools.ts`. Идёт **перед** `resolveWorldNpcs`.

---

## `resolveWorldNpcs`

После look отдельный LLM-pass смотрит текст и NPC **здесь**. До 5 раундов; финал: `DONE`.

1. Уточнение к человеку из `npcsHere` → [`update_mentioned_npc`](../tools/README.md#update_mentioned_npc) (только карточка, без acquaintance/memory)
2. Новое имя или устойчивая роль → [`search_npc`](../tools/README.md#search_npc) → нет: [`create_mentioned_npc`](../tools/README.md#create_mentioned_npc). Посадка в `ctx.locationId`. **Без** `ensure_npc_acquaintance`
3. Массовку без сущности игнорировать. Без личного имени: `title`=роль, `name`=роль

Registry: `world/worldNpcTools.ts`.

---

## Как добавлять hook

1. `IAgentHook` (`name` + `run`) в `hooks/`
2. Свой registry tools, если нужны отдельные tools (и секция в [tools README](../tools/README.md))
3. Вставить в `NPC_HOOKS` в `chatWithNpc.ts` или `WORLD_HOOKS` в `describeLocation.ts` (порядок важен)
4. Секция в этом README
