# Локальная разработка (браузер + Neon)

Режим для правок UI и API **без Telegram Mini App** и **без изменения** прод-логики вебхуков, Init Data и деплоя.

## Быстрый старт

```powershell
# один раз: секреты Neon
neon env pull

# шаблоны .env.local (если ещё нет)
copy .env.local.example .env.local
copy frontend\.env.local.example frontend\.env.local

# API + Vite
npm run dev:local
```

Откройте **http://localhost:5173** в браузере.

## Как это устроено

| Слой | Прод | Локально |
|------|------|----------|
| Авторизация API | `X-Telegram-Init-Data` (`auth.ts`) | `LOCAL_DEV=true` → заголовок `X-Local-Dev-Chat-Id` |
| Фронт | Telegram WebApp | `VITE_LOCAL_DEV=true` → мок `window.Telegram.WebApp` |
| БД | Neon `DATABASE_URL` | тот же Neon (отдельный `LOCAL_DEV_CHAT_ID`) |
| Бот | long polling на Render | локально **не стартует**, если `LOCAL_DEV=true` |
| Промокод | личка бота и `GET /api/access` | `LOCAL_DEV=true` пропускает проверку, Mini App открывается сразу |
| Удаление из энциклопедии | недоступно (403) | кнопка и `DELETE /api/encyclopedia/:id` |

Локальный вход по-прежнему идёт через `localDevAuth.ts` и заголовок `X-Local-Dev-Chat-Id`. При `LOCAL_DEV=true` промокод не спрашивается.

## Переменные

**Корень (`.env.local`):**

- `LOCAL_DEV=true` — включает локальный auth middleware (только если `NODE_ENV !== production`).
- `LOCAL_DEV_CHAT_ID` — id «пользователя» в БД (по умолчанию в примере `900001`).
- `DATABASE_URL` — из `neon env pull`.
- Не задавайте `BOT_TOKEN` в `.env.local`, если не хотите дублировать long polling с Render.

**Frontend (`frontend/.env.local`):**

- `VITE_LOCAL_DEV=true`
- `VITE_LOCAL_DEV_CHAT_ID` — тот же id, что на бэкенде.
- `VITE_API_URL=http://localhost:3001` (или ваш `PORT` из корневого `.env`).

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run dev:local` | бэкенд + фронт с подсказками |
| `npm run dev:all` | то же без скрипта инициализации |
| `npm run db:init` | проверка Neon и схемы |

## Telegram / туннели

Чтобы тестировать **настоящий** Mini App с Init Data, используйте `npm run tunnels` и URL из localtunnel — это отдельный сценарий, не локальный браузерный режим.

Подробнее про Neon: [NEON-LOCAL.md](./NEON-LOCAL.md).
