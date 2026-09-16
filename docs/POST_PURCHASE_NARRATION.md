# Нарратив после покупки в магазине

## Описание

После успешной покупки в магазине через `POST /api/shop/:npcId/buy`, клиент может отправить запрос на `POST /api/turn` с флагом `postPurchase` для получения ролевой реакции торговца и опционального описания мастера.

## Процесс

1. **Механическая покупка** (REST API)
   - Клиент отправляет `POST /api/shop/:npcId/buy` с данными покупки
   - Сервер обрабатывает транзакцию: списывает монеты, переносит предмет в инвентарь игрока, обновляет остатки
   - Возвращает результат покупки

2. **Нарратив покупки** (turn API)
   - Клиент отправляет `POST /api/turn` с флагом `postPurchase`
   - Торговец NPC реагирует в характере (благодарит, напутствует, комментирует)
   - Мастер опционально описывает процесс (примерка доспехов, взвешивание оружия)
   - **Важно:** на этом ходе запрещены инструменты изменения монет и предметов — вторичной покупки не происходит

## Контракт API

### Запрос `POST /api/turn`

```typescript
interface IPostPurchaseRequest {
  campaignId: string;
  playerId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  postPurchase: {
    npcId: string;          // ID торговца, у которого купили
    itemName: string;       // Название купленного предмета
    quantity: number;       // Количество (целое число >= 1)
    totalPriceCp: number;   // Общая цена в медных монетах (уже оплачено)
  };
}
```

### Пример запроса

```json
{
  "campaignId": "campaign_123",
  "playerId": "player_456",
  "messages": [
    { "role": "user", "content": "Я хочу купить длинный меч." },
    { "role": "assistant", "content": "Торговец показывает вам длинный меч..." }
  ],
  "postPurchase": {
    "npcId": "npc_789",
    "itemName": "Длинный меч",
    "quantity": 1,
    "totalPriceCp": 1500
  }
}
```

### Ответ

Стандартный формат `ITurnResult`:

```typescript
{
  status: 'done',
  replies: [
    {
      agent: 'npc',
      npcId: 'npc_789',
      npcName: 'Торговец Гарик',
      say: 'Отличный выбор! Это качественный клинок. Пусть он служит тебе верно.',
      do: 'протягивает меч рукоятью вперёд'
    },
    {
      agent: 'master',
      verdict: 'allowed',
      say: 'Ты берёшь меч и чувствуешь его идеальный баланс. Клинок хорошо лежит в руке.',
      toolCalls: []
    }
  ]
}
```

## Ограничения

- Поле `postPurchase` несовместимо с `resume` (нельзя использовать одновременно)
- На нарративном ходе после покупки следующие инструменты **запрещены**:
  - **NPC:** `transfer_coins`, `get_coins`
  - **Master:** `grant_catalog_item`, `transfer_coins`, `get_coins`
- Проверки навыков (`check`) не запрашиваются на этом ходе
- Поле `openShop` не возвращается (магазин уже был открыт)

## Валидация

Сервер проверит:
- `npcId` существует и принадлежит кампании
- `itemName` — непустая строка
- `quantity` — целое число >= 1
- `totalPriceCp` — целое число >= 0
- `postPurchase` не используется вместе с `resume`

## Сценарии использования

### Значимая покупка (оружие, доспехи, магическая вещь)
- NPC: развёрнутая реакция, совет по использованию
- Master: описание примерки, ощущений

### Обычная покупка (верёвка, факел, провизия)
- NPC: короткая реплика («Держи. Удачи.»)
- Master: может промолчать (пустая строка в `say`)

## Типичная последовательность в клиенте

```typescript
// 1. Механическая покупка
const buyResult = await fetch('/api/shop/npc_789/buy', {
  method: 'POST',
  body: JSON.stringify({
    playerId: 'player_456',
    itemId: 'item_101',
    quantity: 1
  })
});

const { item, playerCoinsCp } = await buyResult.json();

// 2. Нарратив покупки
const narrativeResult = await fetch('/api/turn', {
  method: 'POST',
  body: JSON.stringify({
    campaignId: 'campaign_123',
    playerId: 'player_456',
    messages: chatHistory,
    postPurchase: {
      npcId: 'npc_789',
      itemName: item.name,
      quantity: item.quantity,
      totalPriceCp: item.priceCp * item.quantity
    }
  })
});

const { replies } = await narrativeResult.json();
// Показываем реакцию торговца и описание мастера
```

## Локализация

- Все строки ошибок, промпты и ответы NPC/мастера — **на русском языке**
- Формат цены в промптах: `15 gp`, `5 sp, 3 cp` и т.д.
