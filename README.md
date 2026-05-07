# @theyahia/planfix-mcp

MCP-сервер для Planfix API — задачи, проекты, контакты, комментарии. **10 инструментов, 2 навыка.**

[![npm](https://img.shields.io/npm/v/@theyahia/planfix-mcp)](https://www.npmjs.com/package/@theyahia/planfix-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Часть серии [Russian API MCP](https://github.com/theYahia/russian-mcp) (50 серверов) by [@theYahia](https://github.com/theYahia).

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "planfix": {
      "command": "npx",
      "args": ["-y", "@theyahia/planfix-mcp"],
      "env": {
        "PLANFIX_API_KEY": "your-api-key",
        "PLANFIX_ACCOUNT": "your-subdomain"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add planfix \
  -e PLANFIX_API_KEY=your-api-key \
  -e PLANFIX_ACCOUNT=your-subdomain \
  -- npx -y @theyahia/planfix-mcp
```

### Streamable HTTP (удалённый сервер)

```bash
PLANFIX_API_KEY=your-key PLANFIX_ACCOUNT=your-sub npx @theyahia/planfix-mcp --http 8080
```

Эндпоинт: `http://localhost:8080/mcp`
Health check: `http://localhost:8080/health`

### Smithery

[![smithery badge](https://smithery.ai/badge/@theyahia/planfix-mcp)](https://smithery.ai/server/@theyahia/planfix-mcp)

```bash
npx -y @smithery/cli install @theyahia/planfix-mcp --client claude
```

### VS Code / Cursor

```json
{
  "servers": {
    "planfix": {
      "command": "npx",
      "args": ["-y", "@theyahia/planfix-mcp"],
      "env": {
        "PLANFIX_API_KEY": "your-api-key",
        "PLANFIX_ACCOUNT": "your-subdomain"
      }
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "planfix": {
      "command": "npx",
      "args": ["-y", "@theyahia/planfix-mcp"],
      "env": {
        "PLANFIX_API_KEY": "your-api-key",
        "PLANFIX_ACCOUNT": "your-subdomain"
      }
    }
  }
}
```

## Авторизация

| Переменная | Обязательная | Описание |
|-----------|-------------|----------|
| `PLANFIX_API_KEY` | Да | API-ключ. Получите: Настройки > Интеграции > API |
| `PLANFIX_ACCOUNT` | Рекомендуется | Субдомен (например `mycompany` из `mycompany.planfix.com`) |
| `PLANFIX_DOMAIN` | Нет | Домен Planfix, например `planfix.ru` для российских аккаунтов. По умолчанию `planfix.com` |
| `PLANFIX_BASE_URL` | Нет | Полный REST URL, например `https://mycompany.planfix.ru/rest`. Имеет приоритет над `PLANFIX_ACCOUNT` |
| `PLANFIX_TOKEN` | Нет | Устаревший вариант, используйте `PLANFIX_API_KEY` |

Base URL: `https://{PLANFIX_ACCOUNT}.{PLANFIX_DOMAIN}/rest/` (если `PLANFIX_ACCOUNT` задан).

## Инструменты (16)

| Инструмент | Описание |
|------------|----------|
| `get_tasks` | Список задач с пагинацией и фильтрами |
| `get_task` | Одна задача по ID |
| `create_task` | Создание новой задачи |
| `update_task` | Обновление задачи (название, описание, статус, исполнитель) |
| `get_contacts` | Список контактов с пагинацией и фильтрами |
| `get_contact` | Один контакт по ID |
| `get_projects` | Список проектов с пагинацией |
| `get_project` | Один проект по ID |
| `get_comments` | Комментарии к задаче |
| `add_comment` | Добавить комментарий к задаче |
| `get_data_tags` | Список аналитик Planfix с пагинацией |
| `get_data_tag` | Одна аналитика по ID |
| `get_data_tag_fields` | Поля аналитики |
| `get_data_tag_entry` | Запись аналитики по ключу |
| `get_data_tag_entries` | Записи аналитики с фильтрами, включая `taskId`/`contactId` |
| `get_task_actual_work_time` | Записи фактического времени по задаче и расчетная сводка |

## Навыки (Skills / Prompts) (2)

| Навык | Описание |
|-------|----------|
| `skill-my-tasks` | "Мои задачи на сегодня" — показывает задачи с дедлайном сегодня или просроченные |
| `skill-create-task` | "Создай задачу в проекте" — пошаговый помощник для создания задачи с выбором проекта |

## Примеры

```
Покажи мои задачи в Planfix
Создай задачу "Подготовить отчёт" в проекте 123
Список контактов
Покажи проекты
Добавь комментарий к задаче 456: "Готово"
Покажи поля аналитики 28008
Покажи фактическое время по задаче 20795
```

### Аналитики и фактическое время

`get_task` с полем `dataTags` показывает только привязанные аналитики и ключи записей. Чтобы прочитать значения записей, используйте инструменты `datatag/entry`.

Для аналитики "Фактическое время работы" в аккаунте MageAssist используется `dataTagId = 28008`. Helper `get_task_actual_work_time` использует этот ID по умолчанию, возвращает исходные записи Planfix в `raw` и добавляет `summary`, если поле времени можно надежно распознать.

Примеры:

```json
{
  "tool": "get_data_tag_fields",
  "arguments": { "dataTagId": 28008 }
}
```

```json
{
  "tool": "get_data_tag_entries",
  "arguments": {
    "dataTagId": 28008,
    "taskId": 20795,
    "fields": "dataTag,key,commentId,task,contact"
  }
}
```

```json
{
  "tool": "get_task_actual_work_time",
  "arguments": { "taskId": 20795 }
}
```

## Разработка

```bash
npm install
npm test        # Vitest
npm run dev     # tsx watch
npm run build   # TypeScript compile
```

## Planfix — реферальная программа

**35% бессрочный recurring** от всех платежей приведённых клиентов.

- Без сертификации — просто зарегистрируйтесь в партнёрской программе
- Recurring: получаете 35% каждый месяц, пока клиент платит
- Бессрочно: нет ограничений по времени выплат

Подробнее: [planfix.com/partners](https://planfix.com/ru/partner-program/)

## Лицензия

MIT
