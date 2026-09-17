# Готовые фичи

Карта того, что уже реализовано в бэкенде: domain → services → LLM tools → API.  
Контракты tools (args / return) — в [`services/llm/tools/README.md`](services/llm/tools/README.md).  
Roadmap и будущие агенты (`plan.drawio`) сюда не входят.

**Поддержка:** новая capability → строка в этом файле со ссылками на слои. Детали tool — только в [`services/llm/tools/README.md`](services/llm/tools/README.md), сюда не копировать.

---

## Игровые фичи

### Магазины и торговцы

NPC могут быть торговцами с определённой специализацией (оружейник, бронник, аптекарь, общие товары, инструменты). Каждая специализация определяет, какие предметы из справочника PHB торговец продаёт.

**Специализации:** `weaponsmith` (Оружейник), `armorer` (Бронник), `apothecary` (Аптекарь), `generalGoods` (Общие товары), `toolsmith` (Инструментальщик).

**API:**
- GET `/api/shop/:npcId?playerId=...` — получить данные магазина (автоматически заполняет инвентарь из каталога)
- POST `/api/shop/:npcId/buy` — купить предмет (атомарно переводит монеты и перемещает предмет)

**Открытие магазина:** NPC-торговец возвращает в JSON-ответе поле `openShop: { specialtyKey: "armorer" }`. Turn result агрегирует на верхний уровень `ui.openShop: { npcId, npcName, specialtyKey }` → UI открывает окно магазина. Валидация: specialtyKey всегда соответствует реальному `Npc.shopSpecialtyKey` (при несоответствии автокоррекция; если NPC не торговец — поле удаляется).

| Слой | Путь |
|------|------|
| domain | [`domain/shop/`](domain/shop/) — `specialty/` каталог специализаций, типы магазина, валидация |
| data | [`data/npc/`](data/npc/) — `Npc.shopSpecialtyKey` |
| services | [`services/shop/`](services/shop/) — `ensureShopStock`, `getShopData`, `buyFromShop` |
| NPC agent | NPC JSON-ответ: `{"say":"...","do":null,"openShop":{"specialtyKey":"armorer"}}` |
| API | [`app/api/shop/`](app/api/shop/) |

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
| tools | [`searchPlayerItemsTool.ts`](services/llm/tools/searchPlayerItemsTool.ts) — [`search_player_items`](services/llm/tools/README.md#search_player_items); [`searchLocationItemsTool.ts`](services/llm/tools/searchLocationItemsTool.ts) — [`search_location_items`](services/llm/tools/README.md#search_location_items) |
| API | [`app/api/items/`](app/api/items/) |

### Справочник предметов PHB

Каталог шаблонов предметов PHB (оружие, доспехи, снаряжение, зелья) — JSON в `domain/item/catalog/data/`. Мастер может искать предметы в справочнике и выдавать копии игроку или в локацию. Уникальные именные предметы кампании в справочник не входят.

| Слой | Путь |
|------|------|
| domain | [`domain/item/catalog/`](domain/item/catalog/) — JSON-каталог, `searchItemCatalog`, `getCatalogItemByKey`, `catalogToCreateItem` |
| services | [`services/item/catalog/`](services/item/catalog/) — `grantCatalogItem` (игроку), `grantCatalogItemToLocation` (на пол) |
| tools | [`searchItemCatalogTool.ts`](services/llm/tools/searchItemCatalogTool.ts) — [`search_item_catalog`](services/llm/tools/README.md#search_item_catalog); [`grantCatalogItemTool.ts`](services/llm/tools/grantCatalogItemTool.ts) — [`grant_catalog_item`](services/llm/tools/README.md#grant_catalog_item) |
| Prompt | [`buildMasterPrompt.ts`](services/llm/master/buildMasterPrompt.ts) — секция «Лут и снаряжение из справочника PHB» |

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

**Автоматические правила состояний:**
- **HP = 0** → автоматически накладывается `unconscious` (снимается при восстановлении HP > 0)
- **Exhaustion level 6** → персонаж умирает (`dead = true`). Мёртвый персонаж не может использовать отдых, изменять HP или состояния

| Слой | Путь |
|------|------|
| domain | [`domain/player/`](domain/player/) (`validation/`, `helpers/` — `syncUnconscious`, `syncDeath`) |
| services | [`services/player/conditions/`](services/player/conditions/), [`services/player/hp/`](services/player/hp/), [`services/player/rest/`](services/player/rest/) |
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

### Запланированные встречи (world events)

Создание встречи игрока с NPC в определённой локации и времени (день + слот). При наступлении времени встречи `runPlayerTurn` автоматически запускает диалог с NPC.

**Очередь встреч:** если несколько встреч назначены на один слот, они обрабатываются **по одной за ход** в стабильном порядке (день → слот → id встречи). Остальные остаются pending до следующих ходов.

**Логика запуска (turn):**
1. Проверяет встречи в текущей локации: due → запускает; нет due, но игрок ждёт → запускает ближайшую.
2. Если нет встречи здесь, но игрок ждёт → ищет ближайшую walkable встречу, перемещает игрока, запускает диалог.
3. Возвращает `{ npcId, npcName, title, locationId, locationName, requiresMove }` — turn обрабатывает перемещение и создаёт NPC-шаг с `arrivalTitle`.

**Создание встречи:** через внешний UI / импорт / future tool — сейчас только CRUD на уровне сервисов.

| Слой | Путь |
|------|------|
| domain | [`domain/world-event/`](domain/world-event/) (types, validation, helpers: `isMeetingDue`, `pickMeetingHere`, `pickSoonestMeeting`, `isWaitMessage`) |
| services | [`services/world-event/`](services/world-event/) (`scheduleMeeting`, `tryFireDueMeeting`) |
| turn | [`services/llm/turn/runPlayerTurn.ts`](services/llm/turn/runPlayerTurn.ts) — вызов `tryFireDueMeeting` перед планировщиком |
| data | [`data/world-event/`](data/world-event/) |
| API | — |


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

### Master: прямой вызов (без планировщика)

**Мастер** может быть вызван напрямую для описания окружения, осмотра локации или любых других запросов, где не требуется диалог с NPC. При прибытии в новое место UI вызывает `/api/master` с сообщением игрока типа «Осматриваюсь. Где я?». Master использует tools (`get_player_location`, `search_location_items`, список NPC) для описания.

| Слой | Путь |
|------|------|
| services | [`services/llm/master/adjudicatePlayerAction.ts`](services/llm/master/adjudicatePlayerAction.ts) |
| API | [`app/api/master/`](app/api/master/) — `POST { campaignId, playerId, messages }` → `{ verdict, say, check, toolCalls }` |

### Encounter / Combat

Боевые сцены (encounter): инициатива, порядок хода, лог действий. Монстры выполняют свои ходы через LLM-агента с доступом к combat tools.

**API:**
- GET `/api/encounter/active?campaignId=...&playerId=...` — получить активную боевую сцену с участниками и логом
- POST `/api/encounter/advance` `{ campaignId, playerId? }` — продвинуть ход боя (отыгрывает текущего монстра/NPC, не работает на ходе игрока)

**Monster combat agent:** При ходе монстра вызывается `runMonsterCombatTurn`, который использует LLM с доступом к combat tools (`list_combat_targets`, `get_self_combat_stats`, `roll_dice`, `resolve_monster_attack`). Результаты (say/do/toolCalls) записываются в лог.

| Слой | Путь |
|------|------|
| domain | [`domain/encounter/`](domain/encounter/) (types: `IEncounter`, `IEncounterParticipant`, `IEncounterLog`) |
| data | [`data/encounter/`](data/encounter/) (repositories: `encounterRepository`, `encounterParticipantRepository`, `encounterLogRepository`) |
| services | [`services/encounter/`](services/encounter/) (`startCombat`, `getActiveEncounter`, `advanceCombatTurn`); [`services/llm/monster/`](services/llm/monster/) (`runMonsterCombatTurn`, `loadMonsterCombatContext`) |
| API | [`app/api/encounter/active/`](app/api/encounter/active/), [`app/api/encounter/advance/`](app/api/encounter/advance/) |

---

## CRUD-сущности

Фундамент для внешнего клиента / редактора кампании. Игровая логика мастера — в секции выше (tools + domain rules).

| Сущность | domain | services | API |
|----------|--------|----------|-----|
| Campaigns | [`domain/campaign/`](domain/campaign/) | [`services/campaign/`](services/campaign/) | [`app/api/campaigns/`](app/api/campaigns/) |
| Players | [`domain/player/`](domain/player/) | [`services/player/crud/`](services/player/crud/) | [`app/api/players/`](app/api/players/) |
| Locations (+ children, links, player, npc) | [`domain/location/`](domain/location/), [`domain/location-link/`](domain/location-link/) | [`services/location/`](services/location/), [`services/location-link/`](services/location-link/), [`services/player/location/`](services/player/location/) | [`app/api/location/`](app/api/location/) |
| Items | [`domain/item/`](domain/item/) | [`services/item/crud/`](services/item/crud/) | [`app/api/items/`](app/api/items/) |
| NPCs (+ locations, knowledge, relations, memories, stat-block, combat-stats) | [`domain/npc/`](domain/npc/) | [`services/npc/`](services/npc/) | [`app/api/npcs/`](app/api/npcs/), [`app/api/npc-knowledge/`](app/api/npc-knowledge/), [`app/api/npc-memories/`](app/api/npc-memories/) |
| Quests (+ quest↔npc) | [`domain/quest/`](domain/quest/) | [`services/quest/`](services/quest/) | [`app/api/quests/`](app/api/quests/) |
| Monster catalog + instances | [`domain/monster/`](domain/monster/) | — | — |
| Combat helpers | [`domain/combat/`](domain/combat/) | — | — |

---

## Инфра

| Что | Путь |
|-----|------|
| OpenAPI document | [`app/api/openapi/`](app/api/openapi/), схемы в [`app/api/_shared/openapi/`](app/api/_shared/openapi/) |
