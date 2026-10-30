# Neon + локальный бэкенд

Полная настройка агента Cursor: **[AGENTS.md](./AGENTS.md)** и [Neon agent setup](https://neon.com/prompts/agent-setup.md). Быстрый запуск: `npm run neon:agent-setup`.

После `neon init` / `neon link` (Frankfurt, «Just Postgres») CLI создаёт **`.neon`** и подтягивает секреты в **`.env.local`**.

## Подключение Express к Neon

1. В корне проекта:
   ```bash
   neon env pull
   ```
   Появятся (в `.env.local`):
   - `DATABASE_URL` — **pooled** (для приложения)
   - `DATABASE_URL_UNPOOLED` — для миграций/dump (опционально)

2. При старте бэкенд читает `.env`, затем **`.env.local`** (перекрывает).

3. `initDb()` при каждом запуске:
   - проверяет соединение;
   - создаёт таблицы `rooms`, `user_plants`, `care_history`, `user_settings`, если их ещё нет.

4. Проверка только схемы без сервера:
   ```bash
   npm run db:init
   ```

5. Сборка:
   ```bash
   npm install
   npm run build
   ```

> Не коммитьте `.env.local` и `.neon` — они в `.gitignore`.
