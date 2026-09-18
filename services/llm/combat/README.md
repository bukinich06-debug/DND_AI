# Агент Комбат — ход игрока в бою

Агент для обработки текстового действия игрока во время боя. Валидирует заявку, проверяет дистанцию, выполняет атаки и обновляет состояние БД (HP, isOut, feetFromPlayer).

## Использование

### Из сервиса

```typescript
import { runPlayerCombatTurn } from '@/services/llm/combat';

const result = await runPlayerCombatTurn({
  campaignId: 'campaign_id',
  encounterId: 'encounter_id',
  playerId: 'player_id',
  playerAction: 'Атакую ближайшего гоблина мечом',
});

// result: { say: string, do: string | null, toolCalls: [...] }
```

### Через API (для тестирования)

```bash
curl -X POST http://localhost:3000/api/encounter/player-turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "...",
    "encounterId": "...",
    "playerId": "...",
    "playerAction": "Атакую ближайшего гоблина мечом"
  }'
```

## Структура

- **loadCombatAgentContext** — загружает encounter, participants, игрока (stats + weapons)
- **buildCombatPrompt** — промпт агента (валидация, не мастер мира)
- **combatTools** — набор tools: list_combat_targets, get_player_combat_stats, move_player_in_combat, resolve_player_attack, roll_dice
- **runCombatToolLoop** — основной loop LLM + tools (max 5 раундов)
- **parseCombatReply** — парсинг JSON `{ say, do? }`
- **runPlayerCombatTurn** — входная точка

## Tools

1. **list_combat_targets** — список участников боя с HP/AC/feetFromPlayer
2. **get_player_combat_stats** — характеристики игрока + экипированное оружие
3. **move_player_in_combat** — двигает игрока к цели (уменьшает feetFromPlayer target participant)
4. **resolve_player_attack** — d20+bonus vs AC, урон, обновление HP/isOut; проверка дистанции (melee ≤5 ft, ranged ≤range.normal)
5. **roll_dice** — для проверок характеристик

## Промпт

- Агент валидирует заявку игрока
- Не выдумывает броски/HP — вызывает tools
- Melee ≤5 ft; можно двигаться и атаковать в один ход
- Заклинания пока не реализованы — откажет

## Примеры действий игрока

- "Атакую ближайшего гоблина мечом"
- "Подхожу к гоблину и атакую"
- "Стреляю из лука по гоблину на 20 футах"
- "Использую заклинание огненный шар" → откажет (пока не реализовано)

## Тестирование

1. Создай encounter с игроком и монстром
2. Установи feetFromPlayer у монстра (например, 10 ft)
3. Вызови `runPlayerCombatTurn` с playerAction
4. Проверь, что HP/feetFromPlayer обновились в БД
5. При melee атаке с большой дистанции без move → errorCode: OUT_OF_REACH

## Что НЕ входит в этот PR

- UI не изменён
- В turn/master UI не интегрировано автоматически
- Заклинания (только stub отказа)
- Exploration tools (не для боя)
