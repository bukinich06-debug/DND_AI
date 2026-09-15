# LLM providers

Провайдеры языковых моделей для DND_AI. Поддерживаются DeepSeek, Ollama и Grok через OpenAI-совместимый API.

---

## Переключение провайдера

Провайдер выбирается переменной окружения `LLM_PROVIDER`. По умолчанию используется `deepseek` (для обратной совместимости).

```bash
# DeepSeek (по умолчанию)
LLM_PROVIDER=deepseek

# Ollama
LLM_PROVIDER=ollama

# Grok (xAI)
LLM_PROVIDER=grok
```

---

## Переменные окружения

| Переменная | Требуется | Умолчание | Описание |
|------------|-----------|-----------|----------|
| `LLM_PROVIDER` | нет | `deepseek` | Провайдер: `deepseek`, `ollama` или `grok` |
| **DeepSeek** |
| `DEEPSEEK_API_KEY` | да (для deepseek) | — | API-ключ DeepSeek |
| `DEEPSEEK_API_URL` | нет | `https://api.deepseek.com/v1/chat/completions` | URL DeepSeek API |
| `DEEPSEEK_MODEL` | нет | `deepseek-chat` | Модель DeepSeek |
| **Ollama** |
| `OLLAMA_BASE_URL` | нет | `http://localhost:11434` | Базовый URL Ollama |
| `OLLAMA_MODEL` | да (для ollama) | — | Название модели (например, `llama3.1`, `mistral`) |
| `OLLAMA_API_KEY` | нет | — | API-ключ (если требуется; обычно не нужен локально) |
| **Grok (xAI)** |
| `GROK_API_KEY` | да (для grok) | — | API-ключ xAI (получить на https://console.x.ai) |
| `GROK_API_URL` | нет | `https://api.x.ai/v1/chat/completions` | URL Grok API |
| `GROK_MODEL` | нет | `grok-2-latest` | Модель Grok |

---

## Примеры конфигурации

### DeepSeek (облачный API)

```bash
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
# Опционально:
# DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
# DEEPSEEK_MODEL=deepseek-chat
```

### Grok (облачный API xAI)

```bash
LLM_PROVIDER=grok
GROK_API_KEY=xai-xxxxxxxxxxxxxxxx
# Опционально:
# GROK_API_URL=https://api.x.ai/v1/chat/completions
# GROK_MODEL=grok-2-latest
```

### Ollama (локальный)

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
# OLLAMA_API_KEY не требуется для локального Ollama
```

### Ollama (удалённый с ключом)

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=https://your-ollama-server.com
OLLAMA_MODEL=mistral
OLLAMA_API_KEY=your-api-key
```

---

## Требования к Ollama

1. **Ollama должен быть запущен** локально или доступен по `OLLAMA_BASE_URL`
2. **Модель должна быть загружена**: `ollama pull llama3.1` (или другая модель)
3. **Модель должна поддерживать tools** (function calling) для корректной работы агентов
   - Рекомендуемые модели: `llama3.1`, `mistral`, `mixtral`
   - Если модель не поддерживает tools, вызовы завершатся ошибкой

Ollama использует OpenAI-совместимый endpoint `/v1/chat/completions`, что позволяет работать с теми же типами сообщений и tools.

---

## Архитектура

Все вызовы LLM проходят через единую точку входа: `sendLlmChat` (`sendLlmChat.ts`).

Роутер читает `LLM_PROVIDER` и диспетчеризует запрос в:
- `sendDeepseekChat` для DeepSeek
- `sendOllamaChat` для Ollama
- `sendGrokChat` для Grok (xAI)

Вызывающий код не знает о конкретном провайдере — использует только `sendLlmChat` и общие типы (`ILlmMessage`, `ILlmToolCall`).

### Файлы

| Файл | Назначение |
|------|------------|
| `sendLlmChat.ts` | Роутер, выбирает провайдера по env |
| `sendDeepseekChat.ts` | Реализация DeepSeek API |
| `sendOllamaChat.ts` | Реализация Ollama API (OpenAI-compatible) |
| `sendGrokChat.ts` | Реализация Grok API (xAI, OpenAI-compatible) |
| `types.ts` | Общие типы сообщений и tool calls |

### Использующие модули

- `services/llm/npc/runNpcToolLoop.ts` — диалог с NPC
- `services/llm/master/runMasterToolLoop.ts` — арбитраж действий игрока
- `services/llm/plan/runPlanToolLoop.ts` — планирование запросов игрока
- `services/llm/hooks/helpers/runHookToolLoop.ts` — post-хуки (упоминания NPC/локаций)

---

## Добавление нового провайдера

1. Создать `services/llm/providers/sendYourProvider.ts`
2. Реализовать функцию с сигнатурой `(params: ISendChatParams) => Promise<ILlmMessage>`
3. Добавить провайдера в роутер `sendLlmChat.ts` (тип `LlmProvider`, getProvider, switch case)
4. Добавить env-переменные в `.env.example`
5. Документировать в этом README

Убедитесь, что новый провайдер поддерживает OpenAI-совместимый формат tools (function calling) или корректно обрабатывает их отсутствие.
