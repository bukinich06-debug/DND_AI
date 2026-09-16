# Примеры тестирования нарратива покупки

## Базовый сценарий

### 1. Покупка длинного меча (значимая покупка)

**Шаг 1: Механическая покупка**
```bash
curl -X POST http://localhost:3000/api/shop/npc_123/buy \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_456",
    "itemId": "item_longsword_01",
    "quantity": 1
  }'
```

**Ответ:**
```json
{
  "ok": true,
  "item": {
    "id": "item_abc123",
    "catalogKey": "longsword",
    "name": "Длинный меч",
    "kind": "weapon",
    "description": "Универсальное оружие (1d8/1d10)",
    "quantity": 1,
    "priceCp": 1500,
    "rarity": "common",
    "isMagical": false,
    "properties": ["versatile"],
    "weight": 3
  },
  "playerCoinsCp": 8500,
  "npcCoinsCp": 11500
}
```

**Шаг 2: Нарратив покупки**
```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign_123",
    "playerId": "player_456",
    "messages": [
      { "role": "user", "content": "Я хочу купить длинный меч." },
      { "role": "assistant", "content": "Торговец показывает вам несколько клинков..." }
    ],
    "postPurchase": {
      "npcId": "npc_123",
      "itemName": "Длинный меч",
      "quantity": 1,
      "totalPriceCp": 1500
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "done",
  "replies": [
    {
      "agent": "npc",
      "npcId": "npc_123",
      "npcName": "Торговец Гарик",
      "say": "Отличный выбор! Это качественный клинок. Пусть он служит тебе верно.",
      "do": "протягивает меч рукоятью вперёд"
    },
    {
      "agent": "master",
      "verdict": "allowed",
      "say": "Ты берёшь меч и чувствуешь его идеальный баланс. Клинок хорошо лежит в руке.",
      "toolCalls": []
    }
  ]
}
```

---

### 2. Покупка верёвки (обычная покупка)

**Шаг 1: Механическая покупка**
```bash
curl -X POST http://localhost:3000/api/shop/npc_123/buy \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_456",
    "itemId": "item_rope_01",
    "quantity": 1
  }'
```

**Ответ:**
```json
{
  "ok": true,
  "item": {
    "id": "item_xyz789",
    "catalogKey": "rope",
    "name": "Верёвка (50 футов)",
    "kind": "gear",
    "description": "Прочная пеньковая верёвка",
    "quantity": 1,
    "priceCp": 100,
    "rarity": "common",
    "isMagical": false,
    "properties": [],
    "weight": 10
  },
  "playerCoinsCp": 9900,
  "npcCoinsCp": 10100
}
```

**Шаг 2: Нарратив покупки**
```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign_123",
    "playerId": "player_456",
    "messages": [
      { "role": "user", "content": "Мне нужна верёвка." },
      { "role": "assistant", "content": "Торговец кивает..." }
    ],
    "postPurchase": {
      "npcId": "npc_123",
      "itemName": "Верёвка (50 футов)",
      "quantity": 1,
      "totalPriceCp": 100
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "done",
  "replies": [
    {
      "agent": "npc",
      "npcId": "npc_123",
      "npcName": "Торговец Гарик",
      "say": "Держи. Удачи.",
      "do": null
    },
    {
      "agent": "master",
      "verdict": "allowed",
      "say": "",
      "toolCalls": []
    }
  ]
}
```

---

### 3. Покупка нескольких предметов

**Шаг 1: Механическая покупка**
```bash
curl -X POST http://localhost:3000/api/shop/npc_123/buy \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_456",
    "itemId": "item_potion_healing",
    "quantity": 5
  }'
```

**Шаг 2: Нарратив покупки**
```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign_123",
    "playerId": "player_456",
    "messages": [
      { "role": "user", "content": "Возьму пять зелий лечения." }
    ],
    "postPurchase": {
      "npcId": "npc_123",
      "itemName": "Зелье лечения",
      "quantity": 5,
      "totalPriceCp": 2500
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "done",
  "replies": [
    {
      "agent": "npc",
      "npcId": "npc_123",
      "npcName": "Торговец Гарик",
      "say": "Хорошо запасаешься. В дороге пригодится.",
      "do": "аккуратно укладывает пять склянок в мягкую ткань"
    },
    {
      "agent": "master",
      "verdict": "allowed",
      "say": "Ты убираешь зелья в рюкзак, стараясь не разбить.",
      "toolCalls": []
    }
  ]
}
```

---

### 4. Покупка магического предмета

**Шаг 1: Механическая покупка**
```bash
curl -X POST http://localhost:3000/api/shop/npc_magic_trader/buy \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_456",
    "itemId": "item_ring_protection",
    "quantity": 1
  }'
```

**Шаг 2: Нарратив покупки**
```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign_123",
    "playerId": "player_456",
    "messages": [
      { "role": "user", "content": "Покупаю кольцо защиты." }
    ],
    "postPurchase": {
      "npcId": "npc_magic_trader",
      "itemName": "Кольцо защиты +1",
      "quantity": 1,
      "totalPriceCp": 500000
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "done",
  "replies": [
    {
      "agent": "npc",
      "npcId": "npc_magic_trader",
      "npcName": "Магесса Элара",
      "say": "Мудрый выбор. Это кольцо защитило не одну жизнь. Носи его с честью.",
      "do": "осторожно передаёт кольцо на бархатной подушечке"
    },
    {
      "agent": "master",
      "verdict": "allowed",
      "say": "Ты надеваешь кольцо на палец. Слабое тепло разливается по руке — магия активировалась.",
      "toolCalls": []
    }
  ]
}
```

---

## Проверка безопасности (должно предотвращаться)

### ❌ Попытка повторной покупки через tools (не должна сработать)

После запроса нарратива покупки, NPC **не должен** иметь доступа к `transfer_coins` и `get_coins`, а мастер **не должен** иметь доступа к `grant_catalog_item`.

Это гарантирует, что:
1. Торговец не может повторно списать монеты
2. Мастер не может выдать предмет второй раз
3. Покупка происходит строго один раз — на механическом этапе

---

## Ошибки валидации

### Неверный формат postPurchase

```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign_123",
    "playerId": "player_456",
    "messages": [],
    "postPurchase": {
      "npcId": "npc_123",
      "itemName": "",
      "quantity": 0,
      "totalPriceCp": -100
    }
  }'
```

**Ожидаемая ошибка:**
```json
{
  "ok": false,
  "error": "postPurchase.itemName обязателен."
}
```

### postPurchase вместе с resume

```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign_123",
    "playerId": "player_456",
    "messages": [],
    "postPurchase": { ... },
    "resume": { ... }
  }'
```

**Ожидаемая ошибка:**
```json
{
  "ok": false,
  "error": "postPurchase не может использоваться вместе с resume."
}
```

---

## Интеграция в клиент

```typescript
// Псевдокод для клиента

class ShopService {
  async buyItem(npcId: string, itemId: string, quantity: number) {
    // 1. Механическая покупка
    const buyResponse = await api.post(`/api/shop/${npcId}/buy`, {
      playerId: this.playerId,
      itemId,
      quantity,
    });

    if (!buyResponse.ok) {
      throw new Error(buyResponse.error);
    }

    const { item, playerCoinsCp, npcCoinsCp } = buyResponse;

    // 2. Обновить UI (монеты, инвентарь)
    this.updateCoins(playerCoinsCp);
    this.updateInventory(item);

    // 3. Получить нарратив
    const narrativeResponse = await api.post('/api/turn', {
      campaignId: this.campaignId,
      playerId: this.playerId,
      messages: this.chatHistory,
      postPurchase: {
        npcId,
        itemName: item.name,
        quantity: item.quantity,
        totalPriceCp: item.priceCp * item.quantity,
      },
    });

    // 4. Показать реакцию торговца и описание мастера
    for (const reply of narrativeResponse.replies) {
      if (reply.agent === 'npc') {
        this.showNpcMessage(reply.npcName, reply.say, reply.do);
      } else if (reply.agent === 'master' && reply.say.trim()) {
        this.showMasterMessage(reply.say);
      }
    }

    // 5. Добавить в историю чата
    this.chatHistory.push(...narrativeResponse.replies);
  }
}
```
