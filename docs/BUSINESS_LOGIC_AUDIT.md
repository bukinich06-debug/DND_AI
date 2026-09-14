# Business Logic Audit — DND AI Backend

**Date:** 14 September 2026  
**Scope:** Product logic, agent prompts, world event system, cross-cutting risks  
**Methodology:** Documentation review + code investigation

---

## Executive Summary

### ✅ Works as Designed

- **Agent orchestration:** planner → NPC / master handoff is coherent
- **LLM tools:** comprehensive coverage of D&D mechanics (coins, inventory, proficiencies, conditions, HP, travel, relations, memories, knowledge)
- **NPC chat agent:** strong guardrails (never invents facts, uses tools properly, post-hooks enrich the world)
- **Master adjudication:** clear policy on what must come from tools vs what's narrative permission
- **Post-hooks:** async resolution of mentions (NPCs, locations) is architecturally sound

### ⚠️ Partially Works

- **World event timer:** basic "nextSlot" and "onDay" scheduling exists, but:
  - No time advancement from **travel** — `advanceTravel` mutates `daysLeft` but never touches `Campaign.dayIndex`
  - No time advancement from **rest** — `longRestTool` / `shortRestTool` do not advance the clock
  - `tryFireDueMeeting` can **teleport** the player if meeting location ≠ current location (no warning)
  - Multiple pending events at the same slot: only one fires (no queue)
  - Overdue events: system auto-advances clock on fire if player is late, but player's clock stays stale until next fire attempt
  
- **Master arrival describe:** separate HTTP endpoint exists, but **no automatic call** from move/travel (UI must do it)

- **Dice checks:** Master and NPC correctly defer to UI for d20 rolls, but:
  - Player must manually invoke `/api/dice-rolls` and `/api/turn` resume — no streamlined flow
  - DC from LLM is **not** validated against player sheet (though bonus is computed server-side)

### ❌ Logic Gaps / Inconsistencies

1. **World look agent (legacy):** marked deprecated for arrival, but still exists at `/api/test/location` with different post-hook behavior (no `ensure_npc_acquaintance`, no `ensure_location_link`). This creates two parallel "describe a place" code paths. World look **must not** be used by production UI.

2. **Time does not flow with gameplay actions:**
   - Travel N days: player's `daysLeft` decrements, but campaign clock **never** moves
   - Long rest: no time penalty
   - NPC meetings: can fire at arbitrary clock positions without coherent time bookkeeping

3. **Meeting arrival hijack:** when `tryFireDueMeeting` fires an event with `locationId ≠ player.locationId`, it **calls `movePlayer`** silently before the turn even describes arrival. The player doesn't see "you traveled there" — they just materialize.

4. **No combat system:** Master returns `verdict: defer_combat` but no follow-on combat handler exists. This is a **product gap** (combat is a TODO), not a logic bug per se, but it's a dead end in actual gameplay.

5. **Spawn item tools missing:** Master prompt says "Нет spawn лута" — `create`/`grant` item tools don't exist. UI cannot hand out magic items on the fly. Items must be pre-seeded or manually created via CRUD API.

6. **Exhaustion / conditions edge cases:**
   - `add_player_condition('exhaustion')` increments level by 1 (or sets explicit level if passed)
   - No automatic death at exhaustion level 6 (just a DB number; no business rule enforces it)
   - `unconscious` at 0 HP: Master `apply_player_hp` can set HP=0, which should auto-add `unconscious`, but that's not implemented

7. **No universal world clock advance:** there's no "advance time by 1 slot" or "advance to next morning" tool. Time only moves when a meeting fires (and even then, only via `updateCampaign` in the fire logic).

8. **Planner references nonexistent `world` agent:** `buildPlanPrompt` says "Нельзя agent world" but the old world look still exists. Documentation and code are misaligned.

---

## 1. Capability Map

**Comparison:** FEATURES.md / README.md vs implemented business logic

| Feature | Documented | Implemented | Notes |
|---------|------------|-------------|-------|
| **Dice rolls** | ✅ d4–d100, PC/NPC/Master | ✅ | `/api/dice-rolls` works |
| **Coins** | ✅ cp standard, get/transfer | ✅ | Correct exchange rates |
| **Inventory** | ✅ search/CRUD items | ✅ | `search_player_items` + take/drop/equip tools |
| **Proficiencies** | ✅ read skill/tool/weapon/armor | ✅ | `get_player_proficiencies` |
| **Conditions** | ✅ add/remove/read states | ⚠️ | Tools exist, but no auto-death at exhaustion=6, no auto-`unconscious` at 0 HP |
| **Location & travel** | ✅ move, start_travel, advance_travel | ⚠️ | Travel days decrement, but **campaign clock never advances** |
| **NPC relations** | ✅ score, stance, improve/worsen | ✅ | Delta by reason, auto-memory |
| **NPC memories** | ✅ list, add, aboutNpc | ✅ | |
| **NPC knowledge** | ✅ open/check/hidden | ✅ | Reveal logic correct |
| **NPC acquaintance** | ✅ NPC↔NPC, upsert | ✅ | |
| **NPC chat agent** | ✅ DeepSeek, tools, post-hooks | ✅ | Strong guardrails |
| **Player turn** | ✅ planner → NPC/Master steps | ✅ | Orchestration solid |
| **Master arrival describe** | ✅ `POST /api/location/describe` | ✅ | Exists, but UI must call manually after move/travel |
| **World look** | ⚠️ marked LEGACY | ⚠️ | Still at `/api/test/location`; different hooks; **should not be used** |
| **World events (meetings)** | ✅ schedule_meeting tool | ⚠️ | Fires, but time logic incomplete (see §4) |
| **Combat** | ❌ not mentioned | ❌ | Master returns `defer_combat`, no handler |
| **Spawn/grant items** | ❌ explicitly forbidden in Master prompt | ❌ | No create-item tools exist for agents |
| **Quests** | ✅ CRUD in FEATURES | ✅ | DB + API exist, not yet used by agents |
| **Monster templates** | ✅ CRUD in FEATURES | ✅ | DB + API exist, not yet used in combat |

### Verdict

The documented **CRUD API surface** (campaigns, players, locations, NPCs, items, quests, monster templates) is **complete**. The **agent/gameplay surface** (turn, NPC chat, tools, checks) is **solid** for roleplay and exploration. The **time/combat surface** is **incomplete**: world clock does not advance with gameplay, and combat is a TODO.

---

## 2. Agent & Prompt Review

### 2.1 Planner (`planPlayerInput`)

**File:** `services/llm/plan/buildPlanPrompt.ts`

**Purpose:** Decide which agents (NPC or master) should handle the player's input, in order.

**When invoked:** Start of `/api/turn` (unless resuming from a check).

**Tools available:** `get_player_location`, `search_location`, `search_npc` (read-only, for confirming IDs).

**Key rules (quoted from prompt):**

```
Агенты:
- npc — обращение к конкретному персонажу [...]
- master — суд действия и осмотр места [...]
```

```
Опирайся ТОЛЬКО на снимок и результаты tools. Не выдумывай локации и NPC.
```

```
Нельзя agent world.
```

**Analysis:**

- ✅ Clear separation of concerns: social → NPC, physical/look → master
- ✅ Forbids `world` agent explicitly (though world look still exists in code)
- ✅ Reads `meetings` from snapshot, won't schedule NPC if `here=false`
- ⚠️ Does **not** check if NPC is actually at player's location — relies on snapshot's `npcsHere`; if DB state is stale (e.g., NPC just moved), planner might fail
- ⚠️ Output format: JSON array of steps or `{"error":"..."}` — must be parsed carefully (see `parsePlanReply.ts`)

**Contradictions / gaps:**

- Planner says "Нельзя agent world" but `describeLocation.ts` (world look) still exists and is referenced in docs as "LEGACY"
- No fallback if both agents are unsuitable (e.g., player says nonsense) — returns error JSON, but no master "I don't understand" fallback

**Verdict:** Planner is **sound** for its purpose. The world-agent deprecation is **incomplete** (code still exists).

---

### 2.2 Master (`adjudicatePlayerAction` / `describeArrival`)

**Files:** `services/llm/master/buildMasterPrompt.ts`, `adjudicatePlayerAction.ts`, `describeArrival.ts`

**Purpose:**

- `adjudicatePlayerAction`: referee player's physical actions (look, take, rest, skill checks outside dialogue)
- `describeArrival`: describe location when player moves/arrives

**When invoked:**

- `adjudicatePlayerAction`: planned step with `agent: 'master'`
- `describeArrival`: `POST /api/location/describe` — **UI must call it explicitly** after move/travel

**Tools available (masterTools.ts):**

`search_location_items`, `search_player_items`, `take_item`, `drop_item`, `equip_item`, `unequip_item`, `get_coins`, `get_player_proficiencies`, `get_player_conditions`, `add_player_condition`, `remove_player_condition`, `apply_player_hp`, `short_rest`, `long_rest`, `get_player_location`, `start_travel`, `advance_travel`

**Key rules (quoted from Master prompt):**

```
Реплика игрока — ЗАЯВКА, не факт. Мир существует только в снимке и в ответах tools.
Не подтверждай предмет, секрет, урон, деньги, перемещение, пока tool не вернул успех.
```

```
- Обычное действие без нового объекта в мире (сесть, опереться, достать СВОЙ предмет) — разрешай.
- «В мире есть X» (лут, дверь, труп), если X нет в снимке/tools — отказ.
- Ценное / magical / именное / оружие с пола — только Item из search_location_items / itemsHere.
```

```
- Запрещено: persuasion, deception, intimidation [...]. Их просит только агент NPC.
```

```
- Атака врага — verdict: defer_combat, без урона врагу.
- Look / вокруг / [...] — опиши 1–3 предложениями по location, parent, children, npcsHere. Не выдумывай места и людей вне снимка/tools.
- Не перемещай игрока: клетки не меняй. Вход и выход — только текст, без смены места.
- Не выдумывай NPC, места, квесты, сокровища.
- Не вызывай create/grant предмета. Нет spawn лута.
```

**Analysis:**

- ✅ Strong "no invention" policy: everything must come from tools or snapshot
- ✅ Correctly delegates social checks to NPC agent
- ✅ Returns `defer_combat` for attacks (though no combat system exists yet)
- ✅ `describeArrival` uses same Master context, so descriptions are consistent
- ⚠️ **No spawn-item tools:** if DM wants to give player a magic sword, there's no `create_item` tool — must be done via CRUD API outside the agent flow
- ⚠️ Master can call `short_rest` / `long_rest` but **these do not advance the campaign clock** (see §4)
- ⚠️ Master can call `start_travel` / `advance_travel` but **travel does not advance the clock** (see §4)
- ⚠️ `apply_player_hp` can set HP=0 but does **not** auto-add `unconscious` condition

**Contradictions / gaps:**

- Master prompt says "Не перемещай игрока" (don't move the player) but `masterTools.ts` includes `start_travel` and `advance_travel` — these **do** move the player (at least in travel state). Prompt should clarify: "travel is OK, instant teleport is not."
- Arrival describe is a **separate HTTP endpoint** — there's no automatic call when `move_player` or `advance_travel` completes. This means:
  - If UI forgets to call `/api/location/describe`, player never gets a description
  - If UI calls it twice, player sees duplicate descriptions
  - **Recommended:** describe arrival **automatically** in `move_player` / `advance_travel` return, not as separate API

**Verdict:** Master logic is **sound** for refereeing actions. The separation of arrival description into a separate endpoint is **awkward** and error-prone. The lack of spawn-item tools is a **product limitation**.

---

### 2.3 NPC Chat Agent (`chatWithNpc`)

**File:** `services/llm/npc/buildNpcPrompt.ts`

**Purpose:** Embody one NPC in dialogue with player.

**When invoked:** Planned step with `agent: 'npc'`, or when meeting fires.

**Tools available (npcTools.ts):**

All tools from `masterTools.ts` **except** `search_location_items`, `take_item`, `drop_item`, `equip_item`, `unequip_item`, `apply_player_hp`, `short_rest`, `long_rest` — NPC can't directly manipulate player's HP or inventory pickup.

**Plus:** `transfer_coins` is present (for purchases).

**Key rules (quoted from NPC prompt):**

```
Ты — ${who}. Ты живой персонаж мира D&D, а не ассистент и не ИИ.
```

```
Держи тон строго по stance. Если отношение меняется по делу — используй improve/worsen tools.
```

```
Секреты под проверкой [...] content в say запрещён, пока в снимке нет текста. [...] Если игрок давит и в снимке есть подходящий секрет — ОБЯЗАН вернуть check: skill [...], dc и knowledgeId из снимка. say — пустая строка, do — null. Никакой речи, отказа и «иди к страже» до броска.
```

```
Социальное давление: Читай намерение в речи и действиях, не жди фраз «пытаюсь убедить / обмануть / запугать».
```

```
- Деньги, инвентарь, смена отношения, запись памяти, локация/travel, состояния — только через tools.
- Не подтверждай оплату или передачу предмета, пока tool не вернул успех.
- get_coins / transfer_coins — только если игрок в этой реплике реально платит монетами.
- add_npc_memory: summary самодостаточный (кто + что); не пиши «он/кто-то» без имени или роли.
```

```
- Отвечай только in-character. Никаких «как ИИ», «рад помочь», «отличный вопрос», списков и markdown.
- Говори как человек этой работы в обычном разгове: коротко и по делу. [...] 1–2 коротких предложения, пока игрок не развивает тему.
- Поле say — только речь. Жесты и действия в say запрещены.
- Поле do — по умолчанию null. Заполняй do только если персонаж РЕАЛЬНО совершает наблюдаемое действие с последствиями или выбором для игрока (лезет в карман за ножом/монетой/письмом, встаёт уйти, зовёт стражу, протягивает предмет). Не пиши в do кивки, улыбки, взгляды и «атмосферу».
```

**Analysis:**

- ✅ Strongest prompt in the system: clear in-character mandate, no AI assistant leakage
- ✅ Correctly handles social checks: infers intent from player's words/actions, returns `check` JSON when secret is under pressure
- ✅ Uses tools properly: never confirms coin transfer until tool succeeds
- ✅ Post-hooks (locations, NPCs) enrich the world after NPC's reply — good separation
- ✅ Preloads about-me memories (what other NPCs said about this NPC) — strong continuity
- ✅ Acquaintances snapshot: NPC knows who they know
- ⚠️ `schedule_meeting` tool: NPC can call it, but see world-event issues in §4
- ⚠️ `arrivalTitle` flag: when meeting fires, NPC sees "Ты только что пришёл на договорённую встречу" — good! But if `tryFireDueMeeting` teleported the player, fiction breaks (player doesn't know they moved)

**Contradictions / gaps:**

- NPC prompt says "schedule_meeting — если договорились встретиться: слот и locationId. Не утверждай, что встреча уже произошла." But when the meeting **fires**, the same NPC chat is invoked with `arrivalTitle` — so NPC must start the scene. This is consistent **if** player knows the meeting fired, but if player was teleported silently by `tryFireDueMeeting`, it's a logic gap.

**Verdict:** NPC agent is **excellent**. The only risk is the interplay with world-event auto-teleport (see §4).

---

### 2.4 World Look Agent (LEGACY)

**File:** `services/llm/world/buildWorldPrompt.ts`, `describeLocation.ts`

**Purpose:** Describe a location when player looks around.

**Status:** Marked **LEGACY** in FEATURES.md: "Устаревший одноразовый осмотр локации через отдельного агента World. **Не использовать для arrival-описаний** — UI должен вызывать Master (`POST /api/location/describe`)."

**When invoked:** `POST /api/test/location` (test endpoint).

**Tools available:** Only `move_player` (conditionally, based on strict entry rules).

**Key rules (quoted from World prompt):**

```
Вызови move_player РОВНО ОДИН РАЗ, args: playerId из снимка, locationId = lookAt.id — тогда и только тогда, когда ВСЁ верно:
1) playerHere.id ≠ lookAt.id
2) по реплике игрока персонаж ОКАЗЫВАЕТСЯ ВНУТРИ lookAt

MUST tool (вход/занятость lookAt): захожу, вхожу, вхожу внутрь, выхожу [...]
MUST NOT tool [...]: вокруг, рядом, около, мимо, снаружи [...]
```

```
В look попадают только люди из npcsHere: имя или роль и одно живое занятие [...] Если npcsHere пуст — никого не выдумывай.
```

**Analysis:**

- ⚠️ World agent has **different post-hooks** than NPC chat:
  - `resolveWorldNpcs`: no `ensure_npc_acquaintance` (NPC-to-NPC acquaintance)
  - `resolveWorldLocations`: no `ensure_location_link` (roads between settlements)
  - New NPCs created by world hooks are placed in `ctx.locationId` with `dmNotes` = `auto:described-at:{locationId}` (vs NPC chat: `auto:mentioned-by:{speakerId}`)
- ⚠️ Only tool is `move_player` — can silently move player during a look (if they say "I enter the tavern")
- ⚠️ Look text is persisted to `Location.description` — **overwrites** any previous description
- ✅ Strong "no invention" rule for NPCs (same as Master)

**Contradictions / gaps:**

- **Two parallel "describe a place" code paths:**
  1. Master `describeArrival`: no tools, just describe what's here (recommended)
  2. World look: can call `move_player`, different hooks, persists description to DB
- If UI uses **both** (calls world look after arrival), player might get:
  - First: Master arrival description (ephemeral, in turn log)
  - Second: World look description (persisted to DB, different phrasing)
- FEATURES.md says "Не использовать для arrival-описаний" but `/api/test/location` is still accessible — nothing prevents accidental use

**Verdict:** World look agent is **deprecated but not removed**. The existence of two "describe place" code paths is **confusing** and creates inconsistency. Recommendation: **delete world look agent** entirely, or clearly document when to use each.

---

## 3. World Event Timer / Scheduled Meetings

**Files:**

- `domain/world-event/` (types, validation, helpers)
- `services/world-event/scheduleMeeting.ts`, `tryFireDueMeeting.ts`
- `services/llm/tools/scheduleMeetingTool.ts`
- `domain/world-clock/` (time-of-day slots, next-slot logic)

### 3.1 Data Model

```prisma
model Campaign {
  dayIndex  Int       @default(1)
  timeOfDay TimeOfDay @default(morning)
  ...
}

enum TimeOfDay {
  morning | noon | afternoon | evening | lateEvening | midnight | night
}

model WorldEvent {
  status    WorldEventStatus  @default(pending)
  whenKind  WorldEventWhen
  slot      TimeOfDay
  dayIndex  Int?
  locationId String
  playerId   String
  npcId      String?
  title      String
  ...
}

enum WorldEventWhen {
  nextSlot | onDay
}
```

**Campaign clock:** single `(dayIndex, timeOfDay)` per campaign. Time-of-day has 7 slots: morning → noon → afternoon → evening → lateEvening → midnight → night.

**WorldEvent:** a scheduled meeting. `whenKind`:

- `nextSlot`: fire at next occurrence of `slot` (computed via `nextSlotDay(clock, slot)`)
- `onDay`: fire on specific `dayIndex` at `slot`

---

### 3.2 How Time Advances

**Investigation:** grep for `dayIndex`, `timeOfDay`, `updateCampaign` in services layer.

**Findings:**

1. **`advanceTravel`:** decrements `player.travelDaysLeft`, but **never** calls `updateCampaign({ dayIndex: ... })`. Travel time does **not** advance the campaign clock.

2. **`longRest` / `shortRest`:** restore HP, hit dice, remove exhaustion, but **do not** call `updateCampaign` to move time forward. Long rest is supposed to take ~8 hours (1 or more time slots), but clock stays frozen.

3. **`tryFireDueMeeting`:** when an event is **not** due yet (`isMeetingDue` returns false), it calls:
   ```ts
   const dayIndex = event.dayIndex ?? nextSlotDay(clock, event.slot);
   await updateCampaign(campaignId, { dayIndex, timeOfDay: event.slot });
   ```
   This **jumps** the campaign clock to the meeting time, then fires the event.

4. **No other clock advancement:** no "advance time by 1 slot" tool, no "pass time" mechanism.

**Conclusion:** Time advances **only** when:

- A meeting fires (via `tryFireDueMeeting`)
- The clock jumps to the meeting's scheduled slot if not already due

Time does **not** advance from:

- Travel (days pass in `daysLeft`, but campaign `dayIndex` stays the same)
- Rest (no time cost)
- Player actions (no "wait" command)

---

### 3.3 When Events Fire

**Logic in `tryFireDueMeeting`:**

1. Load all pending events for this player
2. Parse message: if `isWaitMessage(message)` (player says "жду", "ожидаю", "подождать", etc.), treat as waiting
3. Check for meeting "here" (`pickMeetingHere`): event with `locationId === player.locationId`
   - If here and due, fire immediately
   - If here but not due, and player is **not** waiting, return null (no fire)
   - If here but not due, and player **is** waiting, fire (with clock jump)
4. If no meeting here, and player is waiting:
   - Pick soonest meeting overall (`pickSoonestMeeting`)
   - Check if player can walk to meeting location (`canWalkToMeeting` — same settlement or ancestor)
   - If yes, fire (with teleport + clock jump)
5. Fire logic (`fireEvent`):
   - If `event.locationId !== player.locationId`, call `movePlayer` to teleport player to meeting location
   - If event is not due, advance clock to meeting time
   - Set NPC location to meeting location (`setNpcLocation`)
   - Mark event as done

**Analysis:**

- ✅ Basic scheduling works: `nextSlot` and `onDay` are computed correctly
- ✅ Player can wait for overdue meetings
- ⚠️ **Teleport on fire:** if event location ≠ current location, player is **silently moved** via `movePlayer` before the turn even describes arrival
  - Problem: player doesn't see "you traveled to the tavern" — they just appear there
  - Master arrival describe is **not** called automatically
  - If UI doesn't notice the location change and call `/api/location/describe`, player is confused
- ⚠️ **Clock jump:** if player is late for a meeting (e.g., meeting at noon on day 3, but it's afternoon on day 5), the system **rewinds** or **fast-forwards** the clock to the meeting time
  - Outcome: `updateCampaign` is called with `dayIndex = event.dayIndex`, which might be **in the past** or far future
  - If `event.dayIndex` is null (nextSlot), it jumps to the next occurrence of that slot from current clock
- ⚠️ **Multiple events at same slot:** `pickMeetingHere` sorts by day/slot and picks the first due event. If two NPCs want to meet at the same time/place, only one fires. Second event stays pending.
- ⚠️ **Overdue events (no wait):** if player walks into a location with a pending meeting that's overdue, and they don't say "жду", the meeting **does not** fire. Player must explicitly wait.

---

### 3.4 Edge Cases & Scenarios

#### Scenario 1: Travel with pending meeting

- Player is at settlement A, day 1 morning
- Meeting scheduled: NPC X at settlement B, day 2 noon
- Player starts travel to B (3 days via `start_travel`)
- Player advances travel: `advance_travel({ days: 3 })` → arrives at B
- **Expected:** player arrives at B, day 4 morning (1 + 3 days)
- **Actual:** player arrives at B, but campaign clock is still day 1 morning (travel doesn't advance clock)
- Player's turn at B triggers `tryFireDueMeeting` → meeting is overdue (day 2 noon < day 1 morning? no, but let's say clock stayed at day 1)
  - Wait, actually `nextSlotDay(day 1 morning, noon)` = day 1 noon (same day)
  - So meeting "expects" to fire on day 2 noon
  - Current clock is day 1 morning → meeting is in the future
  - Player must wait until day 2 noon for the meeting to fire
  - But how does clock advance to day 2? **Only if player waits** → `tryFireDueMeeting` with `isWaitMessage` → clock jumps to day 2 noon

**Verdict:** Travel days and meeting schedule are **decoupled**. Player can "travel 10 days" but clock stays at day 1. Meetings rely on **explicit wait** + clock jump to fire.

#### Scenario 2: Long rest with morning meeting

- Player is at tavern, day 3 evening
- Meeting scheduled: NPC Y at tavern, day 4 morning
- Player says "I take a long rest"
- Master calls `long_rest` → HP restored, exhaustion -1
- **Expected:** 8 hours pass, clock advances to next morning (day 4 morning) → meeting fires
- **Actual:** clock stays at day 3 evening (long rest doesn't advance time)
- Next turn: player says "good morning" → planner picks master or NPC
- If master, no clock change
- If NPC Y is in `npcsHere`, planner might pick NPC Y → but meeting hasn't "fired" yet (clock still day 3 evening)
- Player must **wait** explicitly to trigger clock jump

**Verdict:** Long rest does **not** advance time. Meeting-based clock jump is the only mechanism. This is **not** how D&D rules work (long rest is 8 hours).

#### Scenario 3: Multiple meetings same slot

- Day 5 noon: meeting A with NPC X at location L
- Day 5 noon: meeting B with NPC Y at location L
- Player is at L, day 5 morning
- Player waits
- `tryFireDueMeeting` → `pickMeetingHere` → sorts by day/slot, picks first (meeting A)
- Meeting A fires: NPC X appears, turn proceeds
- **Meeting B stays pending** (not marked done)
- Player must **wait again** to fire meeting B

**Verdict:** Only one meeting per wait. If player forgets to wait again, meeting B never fires.

#### Scenario 4: Teleport to distant meeting

- Player at settlement A
- Meeting scheduled: NPC Z at settlement C (not connected by `canWalkToMeeting`)
- Player says "жду"
- `tryFireDueMeeting` → soonest meeting is at C, but `canWalkToMeeting(A, C)` = false
- **Expected:** meeting does not fire (player can't reach C)
- **Actual:** correct, meeting does not fire
- But if C **is** reachable (same settlement or ancestor), player is **teleported** via `movePlayer({ locationId: C })` without description

**Verdict:** Teleport happens silently. Player sees no "you traveled" narrative.

---

### 3.5 Business Logic Conclusion

**Works:**

- Basic scheduling (`nextSlot`, `onDay`) is sound
- Meetings fire when player is at the right location and time (or waits)
- NPC arrival is tagged with `arrivalTitle`, so NPC prompt knows to start the scene

**Partially works:**

- Clock jumps to meeting time when player waits — **but** this is the **only** way time advances
- Overdue meetings fire (with clock correction), but only if player waits

**Broken / incomplete:**

1. **Travel does not advance time:** `advanceTravel` mutates `daysLeft` but never touches `Campaign.dayIndex`. A 10-day journey has no time cost.
2. **Rest does not advance time:** `longRestTool` should advance clock by 8 hours (~1–2 time slots), but doesn't.
3. **Silent teleport on meeting fire:** `movePlayer` is called before turn describes anything. Player doesn't see "you traveled to the tavern for the meeting."
4. **Multiple meetings at same slot:** only one fires per wait. No queue.
5. **No universal time-advance tool:** agents can't "pass time" or "wait until morning." Only meetings can move the clock.

**Recommended fixes (product-level):**

- **P0 (critical):**
  1. `advanceTravel`: compute total days traveled, call `updateCampaign({ dayIndex: campaign.dayIndex + totalDays })` when travel completes
  2. `longRestTool`: advance clock by 1 or 2 slots (morning → evening, or evening → next morning)
  3. `tryFireDueMeeting`: when `movePlayer` is called, return a flag `{ teleported: true, from: oldLocationId, to: newLocationId }` so turn can describe the transition ("You hurry to the tavern for your meeting")
  
- **P1 (high):**
  4. Add `advance_time` tool for master: "игрок ждёт час / до утра / до вечера" → advance clock by N slots
  5. Meeting queue: if multiple meetings at same slot, fire all of them in sequence (or let planner decide)
  
- **P2 (nice-to-have):**
  6. Auto-call `/api/location/describe` when `movePlayer` or `advanceTravel` completes (backend returns description in same response, or triggers arrival describe automatically)
  7. Delete world look agent entirely (or clearly document when to use it vs Master describe)

---

## 4. Cross-Cutting Business Risks

### 4.1 Master vs NPC Ownership of Checks

**Rule:** Social checks (persuasion, deception, intimidation) → NPC agent. All others (perception, stealth, athletics, thieves' tools, etc.) → Master agent.

**Implementation:** Master prompt explicitly forbids persuasion/deception/intimidation. NPC prompt infers intent from player's words/actions and returns `check` JSON.

**Risk:** If planner chooses wrong agent (e.g., routes "I try to convince the guard" to master instead of NPC), master will refuse with "denied" verdict.

**Mitigation:** Planner prompt is clear about social → NPC. **Low risk.**

---

### 4.2 Arrival Describe vs Turn

**Current flow:**

1. Player moves (via `move_player` tool or `advance_travel` arrival)
2. Tool returns success
3. **UI must call** `POST /api/location/describe`
4. UI displays description

**Risk:** If UI forgets step 3, player never sees where they are.

**Recommendation:** Merge arrival description into `move_player` / `advanceTravel` return. When `movePlayer` is called, automatically invoke `describeArrival` and include `{ description, locationId, locationName }` in the response.

**Priority:** P1 (high) — UX issue.

---

### 4.3 World Agent Disabled but Still Referenced

**Status:** World look agent exists at `/api/test/location`, but FEATURES.md says "Устаревший [...] Не использовать."

**Risk:** Developer reads code, sees `describeLocation.ts`, uses it instead of Master arrival describe → inconsistent world state (different post-hooks, `Location.description` overwritten).

**Recommendation:** **Delete** `services/llm/world/describeLocation.ts` and `/api/test/location`. If there's a use case for world look (e.g., DM manually describing a place), create a separate "DM tool" that's clearly not part of player turn flow.

**Priority:** P1 (high) — code hygiene, prevents misuse.

---

### 4.4 Inventing Balance/Facts Without Tools

**Master:** "Не подтверждай предмет, секрет, урон, деньги, перемещение, пока tool не вернул успех."

**NPC:** "Деньги, инвентарь, смена отношения, запись памяти, локация/travel, состояния — только через tools."

**Risk:** Prompt drift — if model ignores prompt, it might confirm "you picked up the sword" before `take_item` succeeds.

**Mitigation:** Tool loop is synchronous; final reply is parsed from JSON. If tool fails, reply should reflect failure. **Medium risk** (depends on LLM compliance).

**Recommendation:** Add **validation** in `runMasterToolLoop` / `runNpcToolLoop`: if reply mentions "ты поднял", "ты заплатил", etc., but corresponding tool was not called or failed, reject the reply and retry (or log warning).

**Priority:** P2 (nice-to-have) — defense-in-depth.

---

### 4.5 Campaign Clock Consistency

**Risk:** Clock can jump backward (e.g., overdue meeting in the past) or skip days (e.g., meeting on day 10 when current is day 3).

**Current behavior:** `updateCampaign` is called with `dayIndex = event.dayIndex` when meeting fires. If `event.dayIndex` is in the past, clock moves backward.

**Scenario:**

- Campaign clock: day 5 noon
- Meeting scheduled: day 3 morning (player missed it)
- Player waits
- `tryFireDueMeeting` → `isMeetingDue` = false (day 3 < day 5)
- Wait, no: `isMeetingDue` checks `clock.dayIndex > day` → true (overdue)
- So meeting is **already due**, fires immediately, **no clock change**
- Actually, let me re-read `fireEvent`:
  ```ts
  const due = isMeetingDue(event, clock, atId);
  if (!due) {
    const dayIndex = event.dayIndex ?? nextSlotDay(clock, event.slot);
    await updateCampaign(campaignId, { dayIndex, timeOfDay: event.slot });
  }
  ```
- If event is **not due yet**, clock is advanced. If event is **already overdue**, clock is not changed.

**Conclusion:** Clock does **not** move backward. But it can **skip forward** if player waits for a future meeting (e.g., day 3 → day 10).

**Risk:** Medium — skipping days might cause other time-based events to be missed (but there are no other time-based events in the system yet).

**Recommendation:** Log warning when clock skips more than 1 day. Consider "auto-fire" for any overdue meetings in between.

**Priority:** P2 (nice-to-have) — edge case.

---

### 4.6 Travel vs Instant Move

**Master prompt:** "Не перемещай игрока: клетки не меняй."

**But:** Master has `start_travel` and `advance_travel` tools, which **do** move the player (in travel state and eventually to destination).

**Contradiction:** Prompt says "don't move the player," but tools move the player.

**Resolution:** Prompt should clarify: "Don't call `move_player` (instant teleport). Use `start_travel` / `advance_travel` for journeys."

**Priority:** P2 (documentation) — prompt wording.

---

### 4.7 No Automatic Death at Exhaustion 6 or 0 HP

**Rules:** D&D 2024: exhaustion level 6 = death. 0 HP = unconscious (death saves start).

**Implementation:**

- `add_player_condition('exhaustion')` sets `exhaustionLevel` (can go up to 6+)
- `apply_player_hp` can set `hpCurrent = 0`
- **No automatic enforcement:** DB allows `exhaustionLevel = 6` without killing PC; `hpCurrent = 0` without adding `unconscious` condition

**Risk:** Low — agents are instructed to handle these cases, but there's no **hard rule** in the code.

**Recommendation:** Add domain validation in `validateAddPlayerCondition` / `applyPlayerHp`:

- If exhaustion reaches 6, throw error or auto-mark player as dead
- If HP reaches 0, auto-add `unconscious` condition

**Priority:** P1 (high) — game rules enforcement.

---

## 5. Summary of Findings by Priority

### P0 — Critical (Blocks Gameplay)

1. **Travel does not advance campaign clock:** `advanceTravel` should call `updateCampaign` with accumulated days. **Impact:** time-based gameplay is broken for travel.
2. **Rest does not advance campaign clock:** `longRestTool` / `shortRestTool` should advance time (long rest = 8 hours). **Impact:** no time cost for resting.
3. **Silent player teleport on meeting fire:** `tryFireDueMeeting` calls `movePlayer` without narrative. **Impact:** breaks fiction, player is confused.

### P1 — High (UX or Consistency Issues)

4. **Arrival description is separate HTTP call:** UI must manually call `/api/location/describe` after move/travel. **Impact:** easy to forget, player never sees where they are. **Fix:** merge into `move_player` / `advanceTravel` return.
5. **World look agent (legacy) still exists:** creates two parallel "describe place" code paths. **Impact:** confusion, inconsistent hooks. **Fix:** delete `describeLocation.ts` and `/api/test/location`.
6. **No spawn-item tools for agents:** Master can't give player a magic sword on the fly. **Impact:** DM must use CRUD API outside agent flow. **Fix:** add `create_item` / `grant_item` tools (with safety limits).
7. **No automatic death at exhaustion 6 / unconscious at 0 HP:** game rules not enforced in code. **Impact:** edge cases where player is at 0 HP but still conscious. **Fix:** add domain validation.

### P2 — Nice-to-Have (Polish)

8. **Multiple meetings at same slot:** only one fires per wait. **Impact:** player must wait multiple times. **Fix:** fire all due meetings in sequence, or let planner handle queue.
9. **No universal time-advance tool:** agents can't "pass time until morning." **Impact:** only meetings advance clock. **Fix:** add `advance_time` tool for master.
10. **Master prompt says "don't move player" but has travel tools:** confusing wording. **Impact:** none (tools work correctly). **Fix:** clarify prompt: "Don't instant-teleport; use travel tools for journeys."
11. **No validation of invented facts:** if LLM ignores prompt and confirms action before tool succeeds. **Impact:** low (prompt compliance is good). **Fix:** add reply validator in tool loop.
12. **Clock can skip days:** if player waits for future meeting. **Impact:** edge case. **Fix:** log warning when clock skips >1 day.

---

## 6. Recommendations

### Immediate (P0)

1. **Implement time advancement in travel:**
   - In `advanceTravel`, when player completes journey (arrives at destination), compute total days traveled: `totalDays = sum of all edge.days in route from start to end`
   - Call `updateCampaign(campaignId, { dayIndex: campaign.dayIndex + totalDays })`
   - Test: player travels 3 days → clock advances by 3 days

2. **Implement time advancement in rest:**
   - `longRestTool`: after `longRest`, advance clock by 2 slots (e.g., evening → next morning), or by 1 day if rest starts in evening/night
   - `shortRestTool`: advance clock by 1 slot (1 hour ≈ stay in same slot, or advance by 1 if at slot boundary)
   - Test: player rests at evening → clock becomes next morning

3. **Fix meeting teleport to include narrative:**
   - In `tryFireDueMeeting`, when `movePlayer` is called before meeting fires, return a flag: `{ teleported: true, fromLocationId, toLocationId, teleportReason: "meeting" }`
   - In `runPlayerTurn`, if turn result includes `teleported`, prepend a narrative line: "Ты спешишь к [location] на встречу с [npc]."
   - Or: call `describeArrival` automatically after teleport, include description in turn reply

### High Priority (P1)

4. **Merge arrival description into move/travel:**
   - Modify `movePlayer` and `advanceTravel` to call `describeArrival` internally when player changes location
   - Return `{ ...locationState, arrivalDescription: string }` so UI gets description in same response
   - Remove `/api/location/describe` or keep it as optional "re-describe current location"

5. **Delete world look agent:**
   - Remove `services/llm/world/describeLocation.ts`, `buildWorldPrompt.ts`, `worldTools.ts`, `runWorldToolLoop.ts`, `parseWorldReply.ts`, hooks in `world/`
   - Remove `/api/test/location` endpoint
   - Update FEATURES.md to remove "World look (legacy)" section
   - Update planner prompt to remove "Нельзя agent world" (it's already not an option)

6. **Add spawn-item tools:**
   - Create `createItemTool.ts`: allows Master to create one item with constraints (e.g., only common/uncommon rarity, or only non-magical, or only if DM flag is set)
   - Add to `masterTools.ts`
   - Update Master prompt: "Ценный/magical предмет — только из tools. Можешь создать обычный предмет (create_item) в исключительных случаях."

7. **Enforce death at exhaustion 6, unconscious at 0 HP:**
   - In `domain/player/validation/validateAddPlayerCondition.ts`: if `condition === 'exhaustion'` and `exhaustionLevel >= 6`, throw error: "Exhaustion level 6 = death. Player cannot continue."
   - In `services/player/conditions/addPlayerCondition.ts`: after adding exhaustion, check if level >= 6 → mark player as dead (or return special status)
   - In `services/llm/tools/applyPlayerHpTool.ts`: after `applyPlayerHp`, if `hpCurrent === 0`, auto-call `addPlayerCondition({ condition: 'unconscious' })`
   - Test: player at 1 HP takes 2 damage → HP=0, unconscious auto-added

### Nice-to-Have (P2)

8. **Handle multiple meetings at same slot:** modify `tryFireDueMeeting` to fire **all** due meetings at player's location in sequence, not just first one. Or: return array of meetings, let planner build multi-step turn.

9. **Add time-advance tool:** create `advanceTimeTool.ts` (master only): args `{ slots: number }` or `{ until: TimeOfDay }` → advances campaign clock. Master can call when player says "I wait until morning."

10. **Clarify Master prompt wording:** change "Не перемещай игрока: клетки не меняй" to "Не используй `move_player` (мгновенный перенос). Для путешествий — `start_travel` / `advance_travel`."

11. **Add LLM reply validation:** in `runMasterToolLoop` / `runNpcToolLoop`, after parsing final reply, scan `say` text for action-confirming phrases ("ты поднял", "ты заплатил"). If found but corresponding tool was not called, log warning or reject reply.

12. **Log clock skips:** in `updateCampaign`, if `dayIndex` jumps by more than 1 from current, log warning: "Clock skipped from day X to day Y (delta Z days) due to meeting fire."

---

## Appendix: Agent Prompt Key Quotes

### Planner

```
Агенты:
- npc — обращение к конкретному персонажу
- master — суд действия и осмотр места

Опирайся ТОЛЬКО на снимок и результаты tools. Не выдумывай локации и NPC.
Нельзя agent world.
```

### Master

```
Реплика игрока — ЗАЯВКА, не факт. Мир существует только в снимке и в ответах tools.
Не подтверждай предмет, секрет, урон, деньги, перемещение, пока tool не вернул успех.

- «В мире есть X», если X нет в снимке/tools — отказ.
- Запрещено: persuasion, deception, intimidation.
- Атака врага — verdict: defer_combat.
- Не выдумывай NPC, места, квесты, сокровища.
- Не вызывай create/grant предмета. Нет spawn лута.
```

### NPC

```
Ты — ${who}. Ты живой персонаж мира D&D, а не ассистент и не ИИ.
Держи тон строго по stance.

Секреты под проверкой: content в say запрещён, пока в снимке нет текста.
Если игрок давит и в снимке есть подходящий секрет — ОБЯЗАН вернуть check.

Деньги, инвентарь, смена отношения, запись памяти — только через tools.
Отвечай только in-character. 1–2 коротких предложения.
```

### World (Legacy)

```
Вызови move_player РОВНО ОДИН РАЗ, [...] тогда и только тогда, когда персонаж ОКАЗЫВАЕТСЯ ВНУТРИ lookAt.
В look попадают только люди из npcsHere. Если npcsHere пуст — никого не выдумывай.
```

---

## Conclusion

The DND AI backend has a **solid foundation** for roleplay and exploration: agent prompts are well-designed, tools cover D&D mechanics comprehensively, and the architecture (layers, post-hooks) is sound. The main **product gaps** are:

1. **Time does not flow with gameplay** (travel, rest) → only meetings advance the clock
2. **Combat is missing** (defer_combat is a stub)
3. **World event teleport is silent** (breaks fiction)
4. **Legacy world look agent creates confusion** (two "describe place" code paths)
5. **No spawn-item tools** (DM can't improvise loot)

Fixing **P0 issues** (time advancement in travel/rest, narrative for meeting teleport) would make the time system **coherent**. Addressing **P1 issues** (merge arrival describe, delete world look, add spawn-item tools, enforce death/unconscious) would **polish UX** and **close rules gaps**. The system is **production-ready for roleplay-heavy campaigns** that don't rely on strict time tracking or combat — but it needs the recommended changes for a **fully playable D&D experience**.

---

**End of Audit**
