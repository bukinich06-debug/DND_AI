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

Текущая локация, мгновенный перенос и путешествие по дням.

| Слой | Путь |
|------|------|
| domain | [`domain/player/`](domain/player/), [`domain/location/`](domain/location/) (path) |
| services | [`services/player/location/`](services/player/location/) |
| tools | [`getPlayerLocationTool.ts`](services/llm/tools/getPlayerLocationTool.ts) — [`get_player_location`](services/llm/tools/README.md#get_player_location); [`movePlayerTool.ts`](services/llm/tools/movePlayerTool.ts) — [`move_player`](services/llm/tools/README.md#move_player); [`startTravelTool.ts`](services/llm/tools/startTravelTool.ts) — [`start_travel`](services/llm/tools/README.md#start_travel); [`advanceTravelTool.ts`](services/llm/tools/advanceTravelTool.ts) — [`advance_travel`](services/llm/tools/README.md#advance_travel) |
| API | [`app/api/players/[id]/location/`](app/api/players/%5Bid%5D/location/) |

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
| API | [`app/api/npc-chat/`](app/api/npc-chat/) |
| UI (тест) | [`app/npc-chat/`](app/npc-chat/), [`components/npc-chat/`](components/npc-chat/) (hooks слева, tools справа) |
| docs | [`services/llm/hooks/README.md`](services/llm/hooks/README.md) |

---

## CRUD-сущности

Фундамент для внешнего клиента / редактора кампании. Игровая логика мастера — в секции выше (tools + domain rules).

| Сущность | domain | services | API |
|----------|--------|----------|-----|
| Campaigns | [`domain/campaign/`](domain/campaign/) | [`services/campaign/`](services/campaign/) | [`app/api/campaigns/`](app/api/campaigns/) |
| Players | [`domain/player/`](domain/player/) | [`services/player/crud/`](services/player/crud/) | [`app/api/players/`](app/api/players/) |
| Locations (+ children) | [`domain/location/`](domain/location/) | [`services/location/`](services/location/) | [`app/api/locations/`](app/api/locations/) |
| Location links | [`domain/location-link/`](domain/location-link/) | [`services/location-link/`](services/location-link/) | [`app/api/location-links/`](app/api/location-links/) |
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
