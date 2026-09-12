# Ход игрока (`/api/turn`)

Один HTTP-запрос не ждёт кнопку. Если NPC или мастер просят проверку навыка, ответ — `status: "need_check"` и закладка `resume`. Игрок бросает d20 (`POST /api/dice-rolls`), затем второй `POST /api/turn` с `resume` + `check` + `rollId`. Планировщик на втором запросе **не** вызывается.

Тест UI: `/turn`.

---

## Карта файлов

| Что | Путь |
|-----|------|
| Оркестратор | `runPlayerTurn.ts` |
| Типы ответа | `types.ts` |
| Разбор `resume` | `parseTurnResume.ts` |
| DC / бонус с листа | `resolveRequestedCheck.ts` |
| Парсер check из JSON агента | `services/llm/check/parseRequestedCheck.ts` |
| Текст факта броска | `services/llm/check/formatCheckOutcome.ts` |
| HTTP | `POST /api/turn` |
| Бросок | `POST /api/dice-rolls` |

Планировщик (`planPlayerInput`) — только если в теле нет `resume`.

---

## Запрос 1 — новая реплика

```ts
POST /api/turn
{
  campaignId: string
  playerId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}
```

`runPlayerTurn` строит план (`npc` / `master`) и гоняет шаги по порядку. **Агент `world` отключён**: планировщик конвертирует его в `master`.

Агент **не** бросает кубик за игрока. Если нужна проверка, в финальном JSON:

```json
{"verdict":"check","say":"...","check":{"skill":"perception","dc":15}}
```

или у NPC:

```json
{"say":"...","do":null,"check":{"skill":"persuasion","dc":15,"knowledgeId":"..."}}
```

Цикл шагов останавливается. Ответ:

```ts
{
  status: 'need_check'
  replies: ITurnReply[]  // уже отыгранные шаги; речь NPC до броска не входит
  check: {
    skill: string        // ключ PHB, например persuasion
    skillLabel: string   // «Убеждение» — для кнопки
    dc: number
    bonus: number        // с листа, не из LLM
    die: 'd20'
    knowledgeId: string | null
  }
  resume: {
    agent: 'npc' | 'master'
    npcId?: string
    remainingSteps: IPlanStep[]  // шаги плана после текущего
  }
}
```

Сервер не верит DC/бонусу с клиента при продолжении. Бонус всегда `skillBonus` с листа. Если есть `knowledgeId` — навык и DC берутся из знания NPC в БД.

`world` проверку не просит (это осмотр). Поиск тайника / perception / stealth вне диалога — `master`. Убеждение, обман, запугивание и секреты NPC (`reveal: check`) — только агент `npc` (по намерению в реплике, не по фразе «пытаюсь…»). В системном снимке NPC видит id/title/dc/skillHint таких знаний без `content`, пока проверка не успешна. Мастер эти три скилла в `check` не отдаёт.

UI должен **сохранить** `messages`, `check` и `resume` (state). После F5 закладки нет — сервер её не хранит.

### Описание прибытия

Когда игрок меняет локацию (`move_player`, `advance_travel` с прибытием), **turn** этого не описывает. UI должен вызвать `POST /api/location/describe { campaignId, playerId }` → `{ description, locationId, locationName }`.

Мастер опишет, где игрок и что видит, по текущей локации из БД. Этот текст можно добавить в лог как `{ role: 'assistant', content: description }`.

---

## Запрос 2 — после броска

1. `POST /api/dice-rolls` `{ campaignId, playerId, die: "d20", note: "persuasion" }` → `{ id, value, ... }`
2. `POST /api/turn`:

```ts
{
  campaignId,
  playerId,
  messages,           // тот же чат, что в запросе 1
  resume,             // как пришло в need_check
  check: { skill, dc, knowledgeId },
  rollId              // id из dice-rolls
}
```

Бросок должен быть d20, той же кампании и того же игрока. Итог: `value + bonus >= dc`.

Дальше сразу тот же агент (`npcId` из `resume`), в промпт пишется факт успеха/провала. При успехе с `knowledgeId` в снимке появляется `content` — NPC должен сказать эти факты, без новой проверки и без `get_coins`. Затем выполняются `remainingSteps`.

Ответ при завершении:

```ts
{ status: 'done', replies: ITurnReply[] }
```

Если следующий шаг снова просит проверку — снова `need_check`.

---

## UI (`/turn`)

1. Отправить реплику → `POST /api/turn` без `resume`.
2. Если `need_check` — поле ввода блокируется, кнопка «Бросить d20 (Убеждение +N, Сл DC)». Речи NPC до броска нет.
3. Клик — dice-rolls, затем turn с `resume`. Кубик на клиенте не считается.

Не кладите число броска в текст чата. Только `rollId`.
