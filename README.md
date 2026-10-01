# DND — цифровой мастер (D&D 2024)

Бэкенд для настольной кампании по правилам **Dungeons & Dragons 2024** (Player's Handbook 2024). Роль мастера выполняет **ИИ**: ведёт сцену, опирается на факты из базы и вызывает LLM tools — не выдумывает баланс из контекста чата.

**Этот репозиторий — только серверная часть** (API, domain, services, Prisma/БД, LLM tools). **UI игрока здесь не делается** — фронт будет в отдельном проекте. Не добавлять экраны, формы и клиентский UI в этот репозиторий.

## Как это устроено

- **ИИ** — мастер (нарратив, решения по правилам, вызов tools).
- **Игрок(и)** — клиент во **внешнем** фронтенд-проекте; этот бэкенд отдаёт данные и принимает команды через API / Server Actions / tools.
- **Состояние кампании** хранится в **PostgreSQL** (Prisma): персонажи, инвентарь, монеты, локации, NPC, квесты, состояния, броски и т.д. См. [`prisma/schema.prisma`](prisma/schema.prisma).

Перед покупкой, использованием предмета, проверкой навыка или учётом состояния мастер должен получить данные через сервисы / LLM tools.

## LLM tools

Tools дают мастеру доступ к состоянию кампании: монеты, инвентарь, владения, conditions, броски кубиков и связанные мутации.

- Код: [`services/llm/tools/`](services/llm/tools/)
- Каталог и контракты: [`services/llm/tools/README.md`](services/llm/tools/README.md)

Контекст tool всегда включает `campaignId` (в args его не передают).

## Сделано

- Броски кубиков, монеты, инвентарь / поиск
- Владения и состояния персонажа
- Локация и travel
- CRUD сущностей кампании (players, locations, NPCs, quests и т.д.)

Полная карта со ссылками на код: [`FEATURES.md`](FEATURES.md).

## Архитектура кода

Слои `app` (тонкие route handlers) → `services` → `domain` ← `data`. Правила структуры — в [`AGENTS.md`](AGENTS.md). Стиль кода — [`.cursor/rules/code-style.mdc`](.cursor/rules/code-style.mdc).

## Локальный запуск

1. Скопировать env: `cp .env.example .env` (и при необходимости заполнить LLM-ключи).
2. Поднять Postgres (image из AWS Public ECR, креды совпадают с `DATABASE_URL`):
   ```bash
   npm run db:up
   ```
3. Применить схему и сгенерировать клиент:
   ```bash
   npm run db:generate
   npm run db:push
   ```
4. (Опционально) Заполнить стартовые данные — только по явной команде, `db:push` их не трогает:
   ```bash
   npm run db:seed
   ```
5. Запустить сервер: `npm run dev`

При `APP_ENV=development` и пустом `DEEPSEEK_API_KEY` / `GROK_API_KEY` LLM не вызывается: в чате UI работает `/check` (см. [`services/llm/providers/README.md`](services/llm/providers/README.md)).

Остановить БД: `npm run db:down` (данные в Docker volume сохраняются).

## Стек

- Next.js (App Router) как API/server runtime, TypeScript
- Prisma + PostgreSQL
- Docker Compose — локальный PostgreSQL 16 (`public.ecr.aws/docker/library/postgres:16`)
