# LLM hooks

Post-hooks после ответа NPC-агента. Идут в фоне. Следующий запрос с тем же `campaignId+npcId+playerId` ждёт завершения предыдущего хука (in-memory lock, timeout 90s).

Контракты tools: [`../tools/README.md`](../tools/README.md).

---

## Карта файлов

| Что | Путь |
|-----|------|
| Триггер | `services/llm/npc/chatWithNpc.ts` |
| Запуск очереди | `runAfterAgent.ts` |
| Lock | `store/hookLock.ts` |
| Лог / `turnId` | `store/hookLogStore.ts` |
| Контекст | `types.ts` (`IHookContext`, `IAgentHook`) |
| Места | `location/resolveMentionedLocations.ts` |
| Люди | `npc/resolveMentionedNpcs.ts` |
| HTTP | `POST /api/npc-chat`, статус `GET /api/npc-chat/hooks?turnId=` |
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
`turnId` — poll `GET /api/npc-chat/hooks?turnId=` → `{ hooks: [{ turnId, name, status, toolCalls, error? }] }` (`running` | `done` | `failed`).

### `IHookContext`

`campaignId`, `npcId`, `playerId`, `reply` (`say`/`do`), `messages`, `speakerName`, `playerName`, `turnId`.

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

## Как добавлять hook

1. `IAgentHook` (`name` + `run`) в `hooks/`
2. Свой registry tools, если нужны отдельные tools (и секция в [tools README](../tools/README.md))
3. Вставить в `NPC_HOOKS` в `chatWithNpc.ts` (порядок важен)
4. Секция в этом README
