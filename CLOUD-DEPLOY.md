# Деплой Dimetra: Neon/Supabase + Render + Vercel

Стек для **стабильного доступа к Telegram API** (сервер **вне РФ**):

| Компонент | Сервис | Регион |
|-----------|--------|--------|
| PostgreSQL | **Neon** или **Supabase** | EU/US (бесплатный tier) |
| API + Telegram bot | **Render** Web Service | Frankfurt / Oregon |
| Mini App (React) | **Vercel** или **Netlify** | CDN |

Локальный SQLite больше не используется — только **`DATABASE_URL`**.

---

## Часть 1. PostgreSQL без зарубежной карты

### Вариант A: Neon (рекомендуется)

1. Откройте [https://neon.tech](https://neon.tech) → **Sign up** (GitHub / Google / email).
2. **Create a project** → Region: **EU (Frankfurt)** или **US East**.
3. На дашборде: **Connection details** → вкладка **Connection string**.
4. Скопируйте строку вида:
   ```text
   postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Это значение — **`DATABASE_URL`** для Render.

На бесплатном Neon **карта не нужна**. Лимиты: ~0.5 GB, «sleep» при простое — для бота и Mini App обычно достаточно.

### Вариант B: Supabase

1. [https://supabase.com](https://supabase.com) → **Start your project** (GitHub).
2. **New project** → Region **Frankfurt** / **Ireland**, задайте пароль БД.
3. **Project Settings** → **Database** → **Connection string** → **URI** (mode: Session или Transaction).
4. Подставьте пароль:
   ```text
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
5. Free tier без карты (лимиты по объёму и паузам — см. актуальные условия на сайте).

> Таблицы создаются **автоматически** при первом старте бэкенда (`initDb()`).

---

## Часть 2. Бэкенд на Render

1. Залейте код в **GitHub** (приватный репозиторий — ок).
2. [https://dashboard.render.com](https://dashboard.render.com) → регистрация (GitHub).
3. **New +** → **Web Service** → подключите репозиторий **Dimetra**.
4. Настройки:

   | Поле | Значение |
   |------|----------|
   | **Region** | Frankfurt (EU) или Oregon (US) |
   | **Branch** | `main` |
   | **Root Directory** | *(пусто — корень репо)* |
   | **Runtime** | Node |
   | **Build Command** | `npm ci && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance type** | Free |

5. **Environment Variables** (обязательные):

   | Key | Пример / описание |
   |-----|-------------------|
   | `BOT_TOKEN` | Токен от [@BotFather](https://t.me/BotFather) |
   | `DATABASE_URL` | Строка из Neon/Supabase |
   | `WEB_APP_URL` | HTTPS URL фронта (после деплоя Vercel), напр. `https://dimetra.vercel.app` |
   | `TZ` | `Europe/Moscow` (уведомления по локальному времени) |
   | `PROMO_CODE_PEPPER` | Секрет HMAC для промокодов, не короче 16 символов |
   | `PROMO_ADMIN_IDS` | Telegram ID админов через запятую (команда `/promo`) |

   Render сам задаёт **`PORT`** — в коде: `process.env.PORT || 3000`.

6. **Create Web Service** → дождитесь **Live**.
7. Проверка: `https://ВАШ-СЕРВИС.onrender.com/health` → `{"ok":true}`.

Можно импортировать сервис из **`render.yaml`** в корне репозитория (Blueprint).

### Важно про Render Free

- Сервис **засыпает** после ~15 мин без HTTP-трафика.
- **Long polling бота** держит процесс активным, пока Telegram шлёт updates; при сбоях возможны задержки `/start`.
- Для 24/7 без пауз нужен **paid** instance или другой хостинг (Fly.io, Railway и т.д.).

---

## Часть 3. Фронтенд на Vercel

1. [https://vercel.com](https://vercel.com) → **Add New Project** → импорт того же GitHub-репо.
2. **Root Directory**: `frontend`.
3. **Framework Preset**: Vite.
4. **Build Command**: `npm run build` (по умолчанию).
5. **Output Directory**: `dist`.
6. **Environment Variables**:

   | Key | Значение |
   |-----|----------|
   | `VITE_API_URL` | `https://ВАШ-СЕРВIS.onrender.com` (без `/` в конце) |

7. Deploy → скопируйте URL вида `https://dimetra-xxx.vercel.app`.

8. Вернитесь в **Render** → обновите **`WEB_APP_URL`** на этот HTTPS URL → **Manual Deploy** / redeploy.

9. В BotFather (опционально): Menu Button → Web App URL = `WEB_APP_URL`.

Файл **`frontend/vercel.json`** уже настроен для SPA (fallback на `index.html`).

### Netlify (альтернатива)

- **Base directory**: `frontend`
- **Build**: `npm run build`
- **Publish**: `dist`
- Env: **`VITE_API_URL`** = URL Render
- Конфиг: **`frontend/netlify.toml`**

---

## Часть 4. Локальная разработка

Корень `.env`:

```env
BOT_TOKEN=...
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
WEB_APP_URL=http://localhost:5173
PORT=3001
TZ=Europe/Moscow
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

```bash
npm ci
npm run dev          # бэкенд
npm run dev:frontend # фронт
```

---

## Чеклист переменных

| Где | Переменные |
|-----|------------|
| **Render** | `BOT_TOKEN`, `DATABASE_URL`, `WEB_APP_URL`, `TZ`, `PROMO_CODE_PEPPER`, `PROMO_ADMIN_IDS` (+ автоматически `PORT`) |
| **Vercel / Netlify** | `VITE_API_URL` |
| **Neon / Supabase** | строка → только в Render как `DATABASE_URL` |

---

## Проверка в Telegram

1. `/start` → ответ бота и кнопка Mini App.
2. Mini App открывается с **Vercel HTTPS**.
3. Комнаты/растения сохраняются в **PostgreSQL** (перезапуск Render не стирает данные).

---

## Устранение неполадок

| Проблема | Решение |
|---------|---------|
| Render: crash on start | Logs → проверьте `DATABASE_URL`, SSL (`sslmode=require`) |
| Mini App: Network Error | `VITE_API_URL` = точный URL Render; redeploy Vercel после смены |
| CORS | Бэкенд: `cors()` открытый; origin фронта должен быть HTTPS |
| Бот молчит | Render logs, `BOT_TOKEN`, регион EU/US |
| Пустая БД после деплоя | Другая `DATABASE_URL` или новый проект Neon |
| Vercel собирает старый commit (напр. `dd2f9ff`) | **Deployments** → последний **Ready** деплой должен быть свежим commit на `main`. **Settings → Git**: repo `Gafana/Dimetra-`, branch `main`, Root Directory `frontend`. Статус **Blocked** у старых попыток можно игнорировать — они не выкатываются. **Redeploy** последнего commit без build cache. Проверка сборки: ~2130 modules, CSS ~40 kB (старый фронт ~2110 / ~24 kB). |
| После перевода репо в **Public** | **Settings → Git** → переподключите репозиторий или сделайте **Redeploy** нового commit с `main`, чтобы снять блокировки Hobby/private. |
| Mini App без изменений после деплоя | Полностью закройте Mini App в Telegram и откройте снова (кэш WebView). |

---

## Скрипты в репозитории

**Корень (бэкенд):**

- `"build": "tsc"`
- `"start": "node dist/index.js"`

**Frontend:**

- `"build": "tsc -b && vite build"`
- API: `import.meta.env.VITE_API_URL`

Старый Docker/VPS-гайд: [DEPLOY.md](./DEPLOY.md) (опционально, для self-host).
