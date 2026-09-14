# Готовые фичи

Карта того, что уже реализовано в бэкенде: domain → services → LLM tools → API.  
Контракты tools (args / return) — в [`services/llm/tools/README.md`](services/llm/tools/README.md).  
Roadmap и будущие агенты (`plan.drawio`) сюда не входят.

**Поддержка:** новая capability → строка в этом файле со ссылками на слои. Детали tool — только в [`services/llm/tools/README.md`](services/llm/tools/README.md), сюда не копировать.

---

## Игровые фичи

### Броски кубиков

Бросок d4…d100 с сохранением в кампании (PC / NPC / мастер).

| Слой | Путь |
|------|------|
| domain | [`domain/dice/`](domain/dice/) |
| services | [`services/dice/`](services/dice/) |
| tools | [`rollDiceTool.ts`](services/llm/tools/rollDiceTool.ts) — [`roll_dice`](services/llm/tools/README.md#roll_dice) |
| API | [`app/api/dice-rolls/`](app/api/dice-rolls/) |

### Монеты

Баланс владельца и перевод (покупка / лут) в cp с курсами монет.

| Слой | Путь |
|------|------|
| domain | [`domain/coins/`](domain/coins/) |
| services | [`services/coins/`](services/coins/) |
| tools | [`getCoinsTool.ts`](services/llm/tools/getCoinsTool.ts) — [`get_coins`](services/llm/tools/README.md#get_coins); [`transferCoinsTool.ts`](services/llm/tools/transferCoinsTool.ts) — [`transfer_coins`](services/llm/tools/README.md#transfer_coins) |
| API | [`app/api/coins/transfer/`](app/api/coins/transfer/) |

### Инвентарь / поиск предметов

CRUD предметов и поиск по инвентарю игрока для мастера.

| Слой | Путь |
|------|------|
| domain | [`domain/item/`](domain/item/) |
| services | [`services/item/`](services/item/) (`crud/`, `search/`) |
| tools | [`searchPlayerItemsTool.ts`](services/llm/tools/searchPlayerItemsTool.ts) — [`search_player_items`](services/llm/tools/README.md#search_player_items) |
| API | [`app/api/items/`](app/api/items/) |

### Владения персонажа

Навыки и владения PC для проверок.

| Слой | Путь |
|------|------|
| domain | [`domain/player/`](domain/player/) |
| services | [`services/player/get/`](services/player/get/) |
| tools | [`getPlayerProficienciesTool.ts`](services/llm/tools/getPlayerProficienciesTool.ts) — [`get_player_proficiencies`](services/llm/tools/README.md#get_player_proficiencies) |
| API | — |

### Состояния (conditions)

Чтение, наложение и снятие состояний PC.

| Слой | Путь |
|------|------|
| domain | [`domain/player/`](domain/player/) (`validation/`, `helpers/`) |
| services | [`services/player/conditions/`](services/player/conditions/) |
| tools | [`getPlayerConditionsTool.ts`](services/llm/tools/getPlayerConditionsTool.ts) — [`get_player_conditions`](services/llm/tools/README.md#get_player_conditions); [`addPlayerConditionTool.ts`](services/llm/tools/addPlayerConditionTool.ts) — [`add_player_condition`](services/llm/tools/README.md#add_player_condition); [`removePlayerConditionTool.ts`](services/llm/tools/removePlayerConditionTool.ts) — [`remove_player_condition`](services/llm/tools/README.md#remove_player_condition) |
| API | — |

### Локация и travel

Текущая локация, мгновенный перенос и путешествие по дням. **Travel автоматически продвигает время кампании** на число дней пути.

| Слой | Путь |
|------|------|
| domain | [`domain/player/`](domain/player/), [`domain/location/`](domain/location/) (path) |
| services | [`services/player/location/`](services/player/location/) |
| tools | [`getPlayerLocationTool.ts`](services/llm/tools/getPlayerLocationTool.ts) — [`get_player_location`](services/llm/tools/README.md#get_player_location); [`movePlayerTool.ts`](services/llm/tools/movePlayerTool.ts) — [`move_player`](services/llm/tools/README.md#move_player); [`startTravelTool.ts`](services/llm/tools/startTravelTool.ts) — [`start_travel`](services/llm/tools/README.md#start_travel); [`advanceTravelTool.ts`](services/llm/tools/advanceTravelTool.ts) — [`advance_travel`](services/llm/tools/README.md#advance_travel) |
| API | [`app/api/location/player/`](app/api/location/player/) |

### Время кампании (world clock)

Часы кампании: `Campaign.dayIndex` + `Campaign.timeOfDay`. Слоты суток по порядку: `morning` → `noon` → `afternoon` → `evening` → `lateEvening` → `midnight` → `night` → (следующий день) `morning`.

**Автоматическое продвижение времени:**
- **Travel:** `advance_travel` на N дней → `dayIndex += N`.
- **Короткий отдых:** `short_rest` → время +1 слот. Лимит: 2 коротких отдыха за игровой день (счётчик на Player).
- **Длинный отдых:** `long_rest` → снап к утру следующего дня (`dayIndex + 1`, `timeOfDay = morning`), сброс счётчика коротких отдыхов.
- **Ролевой отдых / ожидание:** `advance_time` (мастер-тул) — двигает время на N слотов без восстановления HP и без траты костей хитов.

**Ролевой отдых vs механический короткий отдых:**
Master system prompt различает:
- Игрок отдыхает / сидит в таверне / чиллит → `advance_time` (нет механики).
- Игрок хочет короткий отдых по правилам (восстановление HP) → `short_rest` (механика D&D, лимит 2/день).

| Слой | Путь |
|------|------|
| domain | [`domain/world-clock/`](domain/world-clock/) (helpers: `advanceSlots`, `snapToNextMorning`) |
| services | [`services/player/rest/`](services/player/rest/), [`services/player/location/advanceTime.ts`](services/player/location/advanceTime.ts) |
| tools | [`advanceTimeTool.ts`](services/llm/tools/advanceTimeTool.ts) — [`advance_time`](services/llm/tools/README.md#advance_time); [`shortRestTool.ts`](services/llm/tools/shortRestTool.ts) — [`short_rest`](services/llm/tools/README.md#short_rest--long_rest); [`longRestTool.ts`](services/llm/tools/longRestTool.ts) — [`long_rest`](services/llm/tools/README.md#short_rest--long_rest) |
| API | — |
| Prompt | [`buildMasterPrompt.ts`](services/llm/master/buildMasterPrompt.ts) — секция «Отдых: ролевой vs механический» |


### NPC: отношения, память, знания

Отношение NPC↔PC (score/stance), воспоминания (с опциональным субъектом `aboutNpcId`) и знания с фильтром reveal для агента. Знакомства NPC↔NPC (`NpcAcquaintance`, однонаправленно).

| Слой | Путь |
|------|------|
| domain | [`domain/npc/`](domain/npc/) (`constants/relationReasons`, `helpers/`, relation/memory/acquaintance types) |
| services | [`services/npc/relation/`](services/npc/relation/), [`services/npc/memory/`](services/npc/memory/), [`services/npc/knowledge/`](services/npc/knowledge/), [`services/npc/acquaintance/`](services/npc/acquaintance/), [`services/npc/search/`](services/npc/search/) |
| tools | [`get_npc_relation`](services/llm/tools/README.md#get_npc_relation); [`improve_npc_relation`](services/llm/tools/README.md#improve_npc_relation); [`worsen_npc_relation`](services/llm/tools/README.md#worsen_npc_relation); [`list_npc_memories`](services/llm/tools/README.md#list_npc_memories); [`add_npc_memory`](services/llm/tools/README.md#add_npc_memory); [`list_npc_knowledge`](services/llm/tools/README.md#list_npc_knowledge); [`get_npc_knowledge`](services/llm/tools/README.md#get_npc_knowledge) |
| API | CRUD: [`app/api/npcs/`](app/api/npcs/) relations/memories, [`app/api/npc-knowledge/`](app/api/npc-knowledge/), [`app/api/npc-memories/`](app/api/npc-memories/) |

### NPC chat agent

Диалог с NPC через DeepSeek: preload характера/relation/memories/about-me (факты о себе по `aboutNpcId`)/acquaintances/knowledge + **tool loop** (все LLM tools). Ответ `{ say, do, toolCalls }`. После ответа — **post-hooks** (фон): сначала `resolveMentionedLocations` (места из реплики → поиск / stub в дереве + дорога между поселениями), затем `resolveMentionedNpcs` (stub или обновление знакомого, двустороннее знакомство); следующий запрос к тому же чату ждёт завершения хука (lock, timeout 90s). Тест UI с логом tools.

| Слой | Путь |
|------|------|
| services | [`services/llm/npc/`](services/llm/npc/) (`chatWithNpc`, `runNpcToolLoop`, `npcTools`); hooks [`services/llm/hooks/`](services/llm/hooks/); provider [`sendDeepseekChat`](services/llm/providers/sendDeepseekChat.ts) |
| API | [`app/api/test/npc-chat/`](app/api/test/npc-chat/) |
| UI (тест) | [`app/npc-chat/`](app/npc-chat/), [`components/npc-chat/`](components/npc-chat/) (hooks слева, tools справа) |
| docs | [`services/llm/hooks/README.md`](services/llm/hooks/README.md) |

### Player turn

Один ход игрока: планировщик → по шагам `npc` / `master` (последовательно). Ответ — массив `{ agent: npc | master }`. Post-hooks не ждут.

| Слой | Путь |
|------|------|
| services | [`services/llm/turn/runPlayerTurn.ts`](services/llm/turn/runPlayerTurn.ts) |
| API | [`app/api/turn/`](app/api/turn/) |

### Master: arrival description

**Мастер** описывает место при прибытии игрока. UI должен вызывать этот API после смены локации (`move_player`, `advance_travel` с прибытием).

| Слой | Путь |
|------|------|
| services | [`services/llm/master/describeArrival.ts`](services/llm/master/describeArrival.ts) |
| API | [`app/api/location/describe/`](app/api/location/describe/) — `POST { campaignId, playerId }` → `{ description, locationId, locationName }` |

### World look (legacy)

Устаревший одноразовый осмотр локации через отдельного агента World. **Не использовать для arrival-описаний** — UI должен вызывать Master (`POST /api/location/describe`). World look сохраняет описание в `Location.description` и запускает post-hooks.

| Слой | Путь |
|------|------|
| services | [`services/llm/world/describeLocation.ts`](services/llm/world/describeLocation.ts) |
| API | [`app/api/test/location/`](app/api/test/location/) (тестовый) |

---

## CRUD-сущности

Фундамент для внешнего клиента / редактора кампании. Игровая логика мастера — в секции выше (tools + domain rules).

| Сущность | domain | services | API |
|----------|--------|----------|-----|
| Campaigns | [`domain/campaign/`](domain/campaign/) | [`services/campaign/`](services/campaign/) | [`app/api/campaigns/`](app/api/campaigns/) |
| Players | [`domain/player/`](domain/player/) | [`services/player/crud/`](services/player/crud/) | [`app/api/players/`](app/api/players/) |
| Locations (+ children, links, player, npc) | [`domain/location/`](domain/location/), [`domain/location-link/`](domain/location-link/) | [`services/location/`](services/location/), [`services/location-link/`](services/location-link/), [`services/player/location/`](services/player/location/) | [`app/api/location/`](app/api/location/); look (тест): [`app/api/test/location/`](app/api/test/location/) |
| Items | [`domain/item/`](domain/item/) | [`services/item/crud/`](services/item/crud/) | [`app/api/items/`](app/api/items/) |
| NPCs (+ locations, knowledge, relations, memories, stat-block, combat-stats) | [`domain/npc/`](domain/npc/) | [`services/npc/`](services/npc/) | [`app/api/npcs/`](app/api/npcs/), [`app/api/npc-knowledge/`](app/api/npc-knowledge/), [`app/api/npc-memories/`](app/api/npc-memories/) |
| Quests (+ quest↔npc) | [`domain/quest/`](domain/quest/) | [`services/quest/`](services/quest/) | [`app/api/quests/`](app/api/quests/) |
| Monster templates | [`domain/monster-template/`](domain/monster-template/) | [`services/monster-template/`](services/monster-template/) | [`app/api/monster-templates/`](app/api/monster-templates/) |
| Combat helpers | [`domain/combat/`](domain/combat/) | — | — |

---

## Инфра

| Что | Путь |
|-----|------|
| OpenAPI document | [`app/api/openapi/`](app/api/openapi/), схемы в [`app/api/_shared/openapi/`](app/api/_shared/openapi/) |
