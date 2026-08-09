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

## Как добавлять tool

1. `services/llm/tools/<name>Tool.ts` — объект `ILlmTool`
2. Строка в оглавлении и секция в этом README
