# `/api/encounter`

HTTP API для боевых сцен (encounters).

Заголовок тел: `Content-Type: application/json`. CORS: любой origin.

Ошибки: `{ "error": "текст" }` — `400` или `404`.

---

## Активный бой

### `GET /api/encounter/active`

Получить информацию об активной боевой сцене в кампании.

| Параметр   | Описание                                                  | Обязательный |
| ---------- | --------------------------------------------------------- | ------------ |
| campaignId | ID кампании                                               | Да           |
| playerId   | ID игрока (для определения `isPlayerTurn`)               | Нет          |

**Ответ:**

```ts
{
  hasActiveEncounter: boolean;
  encounter: {
    encounterId: string;
    round: number;
    currentTurnIndex: number;
    status: string;
    currentParticipantId: string | null;
    isPlayerTurn: boolean;
    participants: Array<{
      id: string;
      kind: 'player' | 'npc' | 'monster';
      displayName: string;
      hpCurrent: number;
      hpMax: number;
      initiative: number;
      feetFromPlayer: number;
      isOut: boolean;
      playerId: string | null;
      npcId: string | null;
      monsterInstanceId: string | null;
    }>;
  } | null;
}
```

**Пример:**

```
GET /api/encounter/active?campaignId={campaignId}&playerId={playerId}
```

**Особенности:**

- `participants` возвращаются в порядке инициативы (по полю `order`)
- `feetFromPlayer` — дистанция от игрока до участника в футах (0 для самого игрока)
- `isPlayerTurn` = `true` только если указан `playerId` и сейчас ход этого игрока
- `hasActiveEncounter` = `false` если активного боя нет, `encounter` = `null`

---

## Использование с существующими API

### Получение оружия и зелий для правой панели UI

Используй существующий API `/api/items`:

```
GET /api/items?playerId={playerId}
```

Фильтруй результат на клиенте:

- **Оружие:** `kind === 'weapon'`
- **Зелья:** `kind === 'consumable'` и в `properties` есть `{ type: 'heal' }`

Для определения дальности атаки:

- Проверяй свойство `{ type: 'range', normal: number, long?: number }` в `properties`
- Если `range` есть — это дальнобойное оружие (сравнивай `feetFromPlayer` цели с `range.normal`)
- Если нет `range` — ближний бой (только цели с `feetFromPlayer <= 5`)

**Пример структуры оружия:**

```json
{
  "id": "...",
  "name": "Длинный лук",
  "kind": "weapon",
  "properties": [
    { "type": "damage", "text": "1d8 колющий", "dice": "1d8", "damageType": "piercing" },
    { "type": "range", "text": "Дистанция 150/600 фт", "normal": 150, "long": 600 },
    { "type": "twoHanded", "text": "Двуручное" }
  ]
}
```

**Пример зелья:**

```json
{
  "id": "...",
  "name": "Зелье лечения",
  "kind": "consumable",
  "properties": [
    { "type": "heal", "text": "Восстанавливает 2d4+2 HP", "dice": "2d4+2" }
  ]
}
```

**Примечание:** Боевые действия (атака, использование зелья) пока **не реализованы** на бэкенде. UI может показывать список, но execute-действия отсутствуют.
