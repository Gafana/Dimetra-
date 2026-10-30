# Текущий статус локального запуска (авто)

Обновлено агентом при настройке окружения.

## Запущено

| Сервис | Локально | Статус |
|--------|----------|--------|
| Frontend (Vite) | http://127.0.0.1:5173 | должен быть запущен |
| Backend (API) | http://127.0.0.1:3001 | перезапущен с `.env` |

## HTTPS-туннели (localtunnel)

> **Важно:** процессы `lt` должны оставаться запущенными. Если закрыли — снова `npm run tunnels` или `scripts/start-tunnels.ps1`.

| Назначение | URL (на момент настройки) |
|------------|---------------------------|
| Mini App (фронт) | https://honest-wings-add.loca.lt |
| API (бэкенд) | https://strong-colts-jump.loca.lt |

Проверка API: https://strong-colts-jump.loca.lt/health

## `.env`

**Корень** — `WEB_APP_URL=https://honest-wings-add.loca.lt`, `PORT=3001`, `TZ=Europe/Moscow`  
**`frontend/.env`** — `VITE_API_BASE_URL=https://strong-colts-jump.loca.lt`

## Осталось вручную

1. **`BOT_TOKEN`** в корневом `.env` (от @BotFather) — вы выбрали прислать в чат.
2. После вставки токена — перезапуск бэкенда (`npm run dev` или `npm run dev:backend`).
3. В Telegram: `/start` → кнопка Web App.

## Команды

```powershell
npm run dev:all          # бэкенд + фронт
npm run dev:backend      # только API (Node 22)
npm run dev:frontend     # только Vite
powershell -File scripts/start-tunnels.ps1
```
