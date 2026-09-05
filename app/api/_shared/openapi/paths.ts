const json = (schema: Record<string, unknown>) => ({
  content: {
    'application/json': { schema },
  },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const errorResponses = {
  '400': {
    description: 'Ошибка запроса',
    ...json(ref('Error')),
  },
  '404': {
    description: 'Не найдено',
    ...json(ref('Error')),
  },
};

const idParam = {
  name: 'id',
  in: 'path' as const,
  required: true,
  schema: { type: 'string' },
};

const campaignIdQuery = {
  name: 'campaignId',
  in: 'query' as const,
  required: true,
  schema: { type: 'string' },
};

const playerIdQuery = {
  name: 'playerId',
  in: 'query' as const,
  required: true,
  schema: { type: 'string' },
};

const locationIdQuery = {
  name: 'locationId',
  in: 'query' as const,
  required: true,
  schema: { type: 'string' },
};

const npcIdParam = {
  name: 'npcId',
  in: 'path' as const,
  required: true,
  schema: { type: 'string' },
};

const crudById = (tag: string, entity: string) => ({
  get: {
    tags: [tag],
    summary: `Получить ${entity}`,
    parameters: [idParam],
    responses: {
      '200': {
        description: 'OK',
        ...json(ref(entity)),
      },
      ...errorResponses,
    },
  },
  patch: {
    tags: [tag],
    summary: `Обновить ${entity}`,
    parameters: [idParam],
    requestBody: {
      required: true,
      ...json(ref(`Update${entity}`)),
    },
    responses: {
      '200': {
        description: 'OK',
        ...json(ref(entity)),
      },
      ...errorResponses,
    },
  },
  delete: {
    tags: [tag],
    summary: `Удалить ${entity}`,
    parameters: [idParam],
    responses: {
      '204': { description: 'Удалено' },
      ...errorResponses,
    },
  },
});

const listCreateByCampaign = (tag: string, entity: string, createSchema: string) => ({
  get: {
    tags: [tag],
    summary: `Список ${entity} по кампании`,
    parameters: [campaignIdQuery],
    responses: {
      '200': {
        description: 'OK',
        ...json({ type: 'array', items: ref(entity) }),
      },
      ...errorResponses,
    },
  },
  post: {
    tags: [tag],
    summary: `Создать ${entity}`,
    requestBody: {
      required: true,
      ...json(ref(createSchema)),
    },
    responses: {
      '201': {
        description: 'Создано',
        ...json(ref(entity)),
      },
      ...errorResponses,
    },
  },
});

export const paths = {
  '/api/campaigns': {
    get: {
      tags: ['Campaigns'],
      summary: 'Список кампаний',
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('Campaign') }),
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Campaigns'],
      summary: 'Создать кампанию',
      requestBody: {
        required: true,
        ...json(ref('CreateCampaign')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('Campaign')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/campaigns/{id}': crudById('Campaigns', 'Campaign'),

  '/api/location': listCreateByCampaign('Location', 'Location', 'CreateLocation'),
  '/api/location/{id}': crudById('Location', 'Location'),
  '/api/location/{id}/children': {
    get: {
      tags: ['Location'],
      summary: 'Дочерние локации',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('Location') }),
        },
        ...errorResponses,
      },
    },
  },
  '/api/location/links': listCreateByCampaign('Location', 'LocationLink', 'CreateLocationLink'),
  '/api/location/links/{id}': crudById('Location', 'LocationLink'),
  '/api/location/player': {
    get: {
      tags: ['Location'],
      summary: 'Текущая локация игрока',
      parameters: [playerIdQuery],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('PlayerLocation')),
        },
        ...errorResponses,
      },
    },
    patch: {
      tags: ['Location'],
      summary: 'Сменить локацию игрока',
      requestBody: {
        required: true,
        ...json(ref('SetPlayerLocation')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('PlayerLocation')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/location/player/advance': {
    post: {
      tags: ['Location'],
      summary: 'Продвинуть путешествие на дни',
      requestBody: {
        required: true,
        ...json(ref('AdvanceTravel')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('PlayerLocation')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/location/player/npcs': {
    get: {
      tags: ['Location'],
      summary: 'NPC в текущей локации игрока',
      parameters: [playerIdQuery],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('NpcAtLocation') }),
        },
        ...errorResponses,
      },
    },
  },
  '/api/location/npcs/{npcId}': {
    get: {
      tags: ['Location'],
      summary: 'Локации NPC',
      parameters: [npcIdParam],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('NpcLocation') }),
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Location'],
      summary: 'Привязать локацию к NPC',
      parameters: [npcIdParam],
      requestBody: {
        required: true,
        ...json(ref('SetNpcLocationBody')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcLocation')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/location/npcs/{npcId}/{locationId}': {
    delete: {
      tags: ['Location'],
      summary: 'Отвязать локацию от NPC',
      parameters: [
        npcIdParam,
        {
          name: 'locationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': { description: 'Удалено' },
        ...errorResponses,
      },
    },
  },
  '/api/test/location': {
    post: {
      tags: ['Location'],
      summary: 'Осмотр текущей локации игрока (world-агент)',
      requestBody: {
        required: true,
        ...json(ref('LocationLookRequest')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('LocationLookReply')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/items': {
    get: {
      tags: ['Items'],
      summary: 'Список предметов по кампании, игроку или локации',
      parameters: [
        { ...campaignIdQuery, required: false },
        { ...playerIdQuery, required: false },
        { ...locationIdQuery, required: false },
      ],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('Item') }),
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Items'],
      summary: 'Создать Item',
      requestBody: {
        required: true,
        ...json(ref('CreateItem')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('Item')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/items/equip': {
    post: {
      tags: ['Items'],
      summary: 'Экипировать предмет',
      requestBody: {
        required: true,
        ...json(ref('EquipItem')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('EquipItemResult')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/items/unequip': {
    post: {
      tags: ['Items'],
      summary: 'Снять предмет',
      requestBody: {
        required: true,
        ...json(ref('UnequipItem')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('Item')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/items/grant': {
    post: {
      tags: ['Items'],
      summary: 'Выдать игроку предмет из справочника (стопка по catalogKey в сумке)',
      requestBody: {
        required: true,
        ...json(ref('GrantCatalogItem')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('Item')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/items/take': {
    post: {
      tags: ['Items'],
      summary: 'Подобрать предмет с пола',
      requestBody: {
        required: true,
        ...json(ref('TakeItem')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('Item')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/items/drop': {
    post: {
      tags: ['Items'],
      summary: 'Бросить предмет на пол',
      requestBody: {
        required: true,
        ...json(ref('DropItem')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('Item')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/items/{id}': crudById('Items', 'Item'),

  '/api/players': listCreateByCampaign('Players', 'Player', 'CreatePlayer'),
  '/api/players/{id}': crudById('Players', 'Player'),
  '/api/players/{id}/hp': {
    post: {
      tags: ['Players'],
      summary: 'Изменить хиты игрока (delta)',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('ApplyPlayerHp')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('ApplyPlayerHpResult')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/players/{id}/rest': {
    post: {
      tags: ['Players'],
      summary: 'Короткий или длинный отдых',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('PlayerRest')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('PlayerRestResult')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/npcs': listCreateByCampaign('Npcs', 'Npc', 'CreateNpc'),
  '/api/npcs/{id}': crudById('Npcs', 'Npc'),
  '/api/npcs/{id}/knowledge': {
    get: {
      tags: ['Npcs'],
      summary: 'Знания NPC',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('NpcKnowledge') }),
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Npcs'],
      summary: 'Добавить знание NPC',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('CreateNpcKnowledgeBody')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('NpcKnowledge')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/npcs/{id}/relations': {
    get: {
      tags: ['NpcRelation'],
      summary: 'Отношения NPC к игрокам',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('NpcRelation') }),
        },
        ...errorResponses,
      },
    },
  },
  '/api/npcs/{id}/relations/{playerId}': {
    get: {
      tags: ['NpcRelation'],
      summary: 'Отношение NPC к игроку',
      parameters: [
        idParam,
        {
          name: 'playerId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcRelation')),
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['NpcRelation'],
      summary: 'Задать отношение NPC к игроку',
      parameters: [
        idParam,
        {
          name: 'playerId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        ...json(ref('SetNpcRelationBody')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcRelation')),
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['NpcRelation'],
      summary: 'Удалить отношение NPC к игроку',
      parameters: [
        idParam,
        {
          name: 'playerId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': { description: 'Удалено' },
        ...errorResponses,
      },
    },
  },
  '/api/npcs/{id}/memories': {
    get: {
      tags: ['NpcMemory'],
      summary: 'Воспоминания NPC',
      parameters: [
        idParam,
        {
          name: 'playerId',
          in: 'query',
          required: false,
          schema: { type: 'string', nullable: true },
        },
        {
          name: 'minImportance',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 5 },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('NpcMemory') }),
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['NpcMemory'],
      summary: 'Добавить воспоминание NPC',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('CreateNpcMemoryBody')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('NpcMemory')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/npcs/{id}/stat-block': {
    get: {
      tags: ['Npcs'],
      summary: 'Статблок NPC',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcStatBlock')),
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Npcs'],
      summary: 'Создать или обновить статблок NPC',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('UpsertNpcStatBlockBody')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcStatBlock')),
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Npcs'],
      summary: 'Удалить статблок NPC',
      parameters: [idParam],
      responses: {
        '204': { description: 'Удалено' },
        ...errorResponses,
      },
    },
  },
  '/api/npcs/{id}/combat-stats': {
    get: {
      tags: ['Npcs'],
      summary: 'Боевые характеристики NPC',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('CombatStats')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/npc-knowledge/{id}': {
    get: {
      tags: ['NpcKnowledge'],
      summary: 'Получить знание NPC',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcKnowledge')),
        },
        ...errorResponses,
      },
    },
    patch: {
      tags: ['NpcKnowledge'],
      summary: 'Обновить знание NPC',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('UpdateNpcKnowledge')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcKnowledge')),
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['NpcKnowledge'],
      summary: 'Удалить знание NPC',
      parameters: [idParam],
      responses: {
        '204': { description: 'Удалено' },
        ...errorResponses,
      },
    },
  },

  '/api/npc-memories/{id}': {
    get: {
      tags: ['NpcMemory'],
      summary: 'Получить воспоминание NPC',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcMemory')),
        },
        ...errorResponses,
      },
    },
    patch: {
      tags: ['NpcMemory'],
      summary: 'Обновить воспоминание NPC',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('UpdateNpcMemory')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcMemory')),
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['NpcMemory'],
      summary: 'Удалить воспоминание NPC',
      parameters: [idParam],
      responses: {
        '204': { description: 'Удалено' },
        ...errorResponses,
      },
    },
  },

  '/api/quests': listCreateByCampaign('Quests', 'Quest', 'CreateQuest'),
  '/api/quests/{id}': crudById('Quests', 'Quest'),
  '/api/quests/{id}/npcs': {
    get: {
      tags: ['Quests'],
      summary: 'NPC квеста',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('QuestNpc') }),
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Quests'],
      summary: 'Добавить NPC к квесту',
      parameters: [idParam],
      requestBody: {
        required: true,
        ...json(ref('AddQuestNpcBody')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('QuestNpc')),
        },
        ...errorResponses,
      },
    },
  },
  '/api/quests/{id}/npcs/{npcId}': {
    delete: {
      tags: ['Quests'],
      summary: 'Убрать NPC из квеста',
      parameters: [
        idParam,
        {
          name: 'npcId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
        {
          name: 'role',
          in: 'query',
          required: true,
          schema: ref('QuestNpcRole'),
        },
      ],
      responses: {
        '204': { description: 'Удалено' },
        ...errorResponses,
      },
    },
  },

  '/api/monster-templates': listCreateByCampaign('MonsterTemplates', 'MonsterTemplate', 'CreateMonsterTemplate'),
  '/api/monster-templates/{id}': crudById('MonsterTemplates', 'MonsterTemplate'),
  '/api/monster-templates/{id}/combat-stats': {
    get: {
      tags: ['MonsterTemplates'],
      summary: 'Боевые характеристики шаблона монстра',
      parameters: [idParam],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('CombatStats')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/dice-rolls': {
    get: {
      tags: ['DiceRolls'],
      summary: 'История бросков по кампании',
      parameters: [campaignIdQuery],
      responses: {
        '200': {
          description: 'OK',
          ...json({ type: 'array', items: ref('DiceRoll') }),
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['DiceRolls'],
      summary: 'Бросить кубик',
      requestBody: {
        required: true,
        ...json(ref('RollDice')),
      },
      responses: {
        '201': {
          description: 'Создано',
          ...json(ref('DiceRoll')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/coins': {
    get: {
      tags: ['Coins'],
      summary: 'Баланс монет игрока',
      parameters: [
        campaignIdQuery,
        {
          name: 'playerId',
          in: 'query' as const,
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('CoinBalance')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/coins/transfer': {
    post: {
      tags: ['Coins'],
      summary: 'Перевести монеты между владельцами',
      requestBody: {
        required: true,
        ...json(ref('TransferCoins')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('TransferCoinsResult')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/test/plan': {
    post: {
      tags: ['Plan'],
      summary: 'Планировщик: какие агенты обработают ввод игрока',
      requestBody: {
        required: true,
        ...json(ref('PlanRequest')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('PlanReply')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/turn': {
    post: {
      tags: ['Plan'],
      summary: 'Ход игрока: агенты, пауза на проверке навыка',
      requestBody: {
        required: true,
        ...json(ref('TurnRequest')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('TurnReply')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/test/master': {
    post: {
      tags: ['Master'],
      summary: 'Рефери мастера (DeepSeek)',
      requestBody: {
        required: true,
        ...json(ref('MasterRequest')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('MasterReply')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/test/npc-chat': {
    post: {
      tags: ['NpcChat'],
      summary: 'Реплика NPC-агента (DeepSeek)',
      requestBody: {
        required: true,
        ...json(ref('NpcChatRequest')),
      },
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcChatReply')),
        },
        ...errorResponses,
      },
    },
  },

  '/api/test/npc-chat/hooks': {
    get: {
      tags: ['NpcChat', 'Location'],
      summary: 'Статус post-hooks по turnId (NPC-чат и world look)',
      parameters: [
        {
          name: 'turnId',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          ...json(ref('NpcChatHooksReply')),
        },
        ...errorResponses,
      },
    },
  },
};
