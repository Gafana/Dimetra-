# Dimetra — локальный запуск и тест в Telegram

Пошаговая инструкция: поднять бэкенд + фронтенд, пробросить **HTTPS-туннели**, настроить бота и пройти чек-лист Mini App.

Структура проекта:

```
Dimetra/
├── src/              # бэкенд (Express + Telegraf + SQLite + cron)
├── frontend/         # Vite + React Mini App
├── package.json      # корневые скрипты
└── .env              # конфиг бэкенда
```

---

## 0. Предварительные требования

- **Node.js 22 LTS** (рекомендуется для `better-sqlite3` на Windows) или Node 20+
- Аккаунт Telegram
- Бот от [@BotFather](https://t.me/BotFather)
- Один из туннелей: **ngrok** или **localtunnel**
- Установленные зависимости:

```bash
# из корня репозитория
npm install
npm install --prefix frontend
```

---

## 1. HTTPS-туннели (обязательно для Telegram)

Telegram Web App и кнопки бота принимают только **HTTPS** (кроме `localhost` в некоторых клиентах Desktop). Для телефона и стабильной проверки Init Data нужны **два публичных HTTPS URL**:

| Сервис   | Локальный порт | Назначение        |
|----------|----------------|-------------------|
| Frontend | `5173`         | Mini App (Vite)   |
| Backend  | `3000`         | REST API + auth   |

### Вариант A: ngrok

1. Установите [ngrok](https://ngrok.com/) и выполните `ngrok config add-authtoken <token>`.
2. В **отдельном терминале** — фронтенд:

```bash
ngrok http 5173
```

Скопируйте **Forwarding** URL вида `https://abcd-123.ngrok-free.app`.

3. В **ещё одном терминале** — бэкенд:

```bash
ngrok http 3000
```

Скопируйте второй HTTPS URL.

> **Важно:** бесплатный ngrok выдаёт новый URL при каждом перезапуске — после этого обновите `.env` и перезапустите процессы.

### Вариант B: localtunnel

1. Сначала запустите Vite и бэкенд локально (см. раздел 4), затем:

```bash
npx localtunnel --port 5173
# запомните URL, например https://funny-cat.loca.lt

npx localtunnel --port 3000
# второй URL для API
```

2. При первом открытии localtunnel в браузере может понадобиться ввести IP — следуйте подсказкам на странице туннеля.

### Проверка туннелей

- `https://<frontend-tunnel>/` — открывается UI Dimetra
- `https://<backend-tunnel>/health` — ответ `{"ok":true}`

---

## 2. Файлы `.env`

### Бэкенд — корень проекта `.env`

Скопируйте шаблон:

```bash
cp .env.example .env
```

Пример для туннелей:

```env
BOT_TOKEN=123456789:AA...your_token_from_BotFather
WEB_APP_URL=https://abcd-123.ngrok-free.app
PORT=3000

# опционально: часовой пояс для cron-уведомлений (совпадает с notification_time)
# TZ=Europe/Moscow
```

| Переменная     | Описание |
|----------------|----------|
| `BOT_TOKEN`    | Токен бота от BotFather |
| `WEB_APP_URL`  | **HTTPS** URL туннеля **фронтенда** (кнопка «Открыть Dimetra» в `/start`) |
| `PORT`         | Порт Express (должен совпадать с тем, что пробрасываете в туннель) |

### Фронтенд — `frontend/.env`

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_BASE_URL=https://xyz-456.ngrok-free.app
```

| Переменная            | Описание |
|-----------------------|----------|
| `VITE_API_BASE_URL`   | **HTTPS** URL туннеля **бэкенда** (axios + `X-Telegram-Init-Data`) |

> В коде используется именно `VITE_API_BASE_URL` (не `VITE_API_URL`). После изменения `.env` **перезапустите** `npm run dev` во `frontend`.

---

## 3. Настройка бота в @BotFather

### 3.1. Создать бота (если ещё нет)

1. Откройте [@BotFather](https://t.me/BotFather).
2. `/newbot` → имя и username → скопируйте **token** в `BOT_TOKEN`.

### 3.2. Mini App (Web App)

**Способ 1 — через Web App в профиле бота**

1. `/mybots` → выберите бота → **Bot Settings** → **Menu Button** → **Configure menu button**.
2. Укажите текст кнопки (например `Открыть Dimetra`) и URL = **HTTPS туннель фронтенда** (`WEB_APP_URL`).

**Способ 2 — `/newapp` (отдельное приложение)**

1. `/newapp` → выберите бота.
2. Title, description, загрузите иконку (по желанию).
3. **Web App URL** = HTTPS туннель фронтенда.

**Способ 3 — только inline-кнопка из кода**

Команда `/start` уже отправляет `web_app` с URL из `WEB_APP_URL`. Достаточно корректного `.env` и перезапуска бэкенда — Menu Button в BotFather не обязателен, но удобен для постоянной кнопки внизу чата.

### 3.3. Домен (если BotFather просит)

Для ngrok иногда нужно указать домен в настройках бота. Используйте домен из URL туннеля (без `https://`).

---

## 4. Запуск в dev-режиме

### Одной командой (рекомендуется)

Из **корня** репозитория:

```bash
npm run dev:all
```

Запускаются параллельно:

- бэкенд: `tsx watch src/index.ts` (через `dev:backend` на Windows с Node 22 из `.tools`, если настроено)
- фронтенд: Vite на `5173`

### Раздельно (два терминала)

```bash
# терминал 1 — корень
npm run dev

# терминал 2 — frontend
npm run dev:frontend
```

После старта поднимите **два туннеля** (раздел 1), если ещё не подняты.

Ожидаемые логи бэкенда:

```
HTTP server listening on http://localhost:3000
Telegram bot started
Notification scheduler started (every minute)
```

---

## 5. Чек-лист проверки

### Шаг 1 — `/start`

1. Найдите бота в Telegram по username.
2. Отправьте `/start`.
3. **Ожидание:** приветствие и кнопка **«🌿 Открыть Dimetra»** (или Menu Button).
4. В БД создаётся запись `user_settings` с `notification_time = 09:00:00`.

### Шаг 2 — Web App

1. Нажмите кнопку открытия Mini App.
2. **Ожидание:** интерфейс Dimetra (тёмно-зелёная тема, нижняя навигация).
3. Если белый экран / ошибка сети — проверьте `VITE_API_BASE_URL` и что туннель бэкенда жив.

### Шаг 3 — тема Telegram

1. Переключите тему Telegram (светлая / тёмная).
2. **Ожидание:** акценты подстраиваются; базовая палитра Dimetra (forest green) сохраняется.

### Шаг 4 — API и Init Data

1. **Добавить** → создайте комнату → добавьте растение из каталога.
2. **Главная** → карточка растения, кнопки «Полить» / «Подкормить».
3. **Настройки** → измените время уведомлений.

**Логи бэкенда при успехе:** запросы `POST /api/rooms`, `POST /api/plants` без `401`.

**Если 401 Unauthorized:**

- Mini App открыт **не из Telegram** (открыли HTTPS туннель в Chrome) — Init Data пустой; тестируйте только из клиента Telegram.
- Неверный `BOT_TOKEN` (подпись Init Data не сходится).
- Старый кэш: закройте Mini App и откройте снова из бота.

**Проверка вручную (опционально):**

```bash
curl https://<backend-tunnel>/api/catalog
# без заголовка Init Data — каталог публичный, должен вернуть JSON
```

### Шаг 5 — уведомления (опционально)

1. В Mini App поставьте `notification_time` на **текущее время + 1–2 минуты** (локальное время сервера / `TZ`).
2. Добавьте растение с просроченным поливом (или нажмите «Полить» и снова выставите дату в прошлое через БД).
3. Дождитесь минутного cron — сообщение от бота в чат.

---

## 6. Типичные проблемы

| Симптом | Решение |
|---------|---------|
| `better_sqlite3.node` not found | Node 22 LTS + `npm rebuild better-sqlite3`, или `npm run dev:backend` (скрипт с portable Node) |
| Страница localhost не открывается | Vite: `host: true` в `frontend/vite.config.ts`; используйте `http://127.0.0.1:5173` |
| CORS / Network Error в Mini App | `VITE_API_BASE_URL` должен быть **HTTPS бэкенд-туннель**, не localhost |
| ngrok «Visit Site» | На бесплатном плане нажмите Continue; для API добавьте заголовок `ngrok-skip-browser-warning` при ручных curl |
| Бот не стартует | Проверьте `BOT_TOKEN`; без токена API работает, бот и cron — нет |

---

## 7. Полезные команды

```bash
npm run typecheck          # проверка TypeScript бэкенда
npm run typecheck --prefix frontend
npm run build              # сборка бэкенда
npm run build --prefix frontend
```

Удачного теста в Telegram.
