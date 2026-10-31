# Деплой Dimetra на VPS (Docker)

> **Актуальный облачный стек (Render + Vercel + Neon/Supabase):** см. **[CLOUD-DEPLOY.md](./CLOUD-DEPLOY.md)**.

# Деплой Dimetra на VPS (24/7)

Продакшен-схема: **nginx** отдаёт статику Mini App и проксирует **`/api/*`** на Node.js-бэкенд. Telegram-бот работает в том же контейнере бэкенда (long polling). SQLite хранится в Docker-томе **`dimetra-data`** (`/data/prod.db`).

## Требования к серверу

- Linux VPS (Ubuntu 22.04/24.04 или аналог)
- Docker Engine + Docker Compose plugin v2
- Домен с A-записью на IP сервера (для HTTPS и Mini App)
- Исходящий доступ к `api.telegram.org` (бот)

## Порты

| Порт | Назначение |
|------|------------|
| **80** | HTTP (nginx, Mini App + API через `/api`) |
| **443** | HTTPS (рекомендуется: Certbot/Caddy перед nginx или reverse proxy) |
| **22** | SSH (администрирование) |

Бэкенд **3000** наружу не публикуется — только внутри Docker-сети.

---

## 1. Подготовка VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git ca-certificates curl

# Docker (официальный скрипт)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
# перелогиньтесь в SSH, чтобы группа docker применилась
```

---

## 2. Клонирование проекта

```bash
cd ~
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> dimetra
cd dimetra
```

---

## 3. Файл `.env` в корне репозитория

```bash
cp .env.example .env
nano .env
```

Минимум для продакшена:

```env
BOT_TOKEN=123456:ABC...your_token_from_BotFather
WEB_APP_URL=https://your-domain.example
PORT=3000
TZ=Europe/Moscow
DATABASE_PATH=/data/prod.db
```

| Переменная | Описание |
|------------|----------|
| `BOT_TOKEN` | Токен бота от [@BotFather](https://t.me/BotFather) |
| `WEB_APP_URL` | **Публичный HTTPS** URL Mini App (тот же домен, что открывает пользователь) |
| `DATABASE_PATH` | В Docker уже задано `/data/prod.db`; менять не обязательно |
| `TZ` | Опционально для логов; уведомления Mini App используют **часовой пояс пользователя** в БД |

Для сборки фронта через Compose (опционально):

```env
# Пусто = API на том же домене (/api), рекомендуется
VITE_API_URL=
```

Если API на **другом** домене (не рекомендуется из‑за CORS), укажите полный origin:

```env
VITE_API_URL=https://api.your-domain.example
```

---

## 4. Сборка и запуск

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
docker compose logs -f backend
```

Проверки:

```bash
curl -s http://127.0.0.1/health
curl -s http://127.0.0.1/api/catalog | head
```

С телефона/Telegram домен должен быть **HTTPS** — см. шаг 5.

---

## 5. HTTPS (обязательно для Telegram Mini App)

Telegram требует **HTTPS** для Web App. Варианты:

### A. Caddy перед Docker (простой вариант)

Проброс: Caddy `:443` → `localhost:80`, автоматический Let's Encrypt.

### B. Certbot + nginx на хосте

Reverse proxy с SSL на хосте → `127.0.0.1:80` (контейнер `frontend`).

После получения сертификата обновите:

```env
WEB_APP_URL=https://your-domain.example
```

И перезапустите бэкенд (кнопка `/start` берёт URL при старте):

```bash
docker compose up -d --force-recreate backend
```

В BotFather (опционально): Menu Button → Web App URL = `WEB_APP_URL`.

---

## 6. Обновление версии

```bash
cd ~/dimetra
git pull
docker compose build
docker compose up -d
```

Данные SQLite **сохраняются** в томе `dimetra-data` и не удаляются при `up -d`.

---

## 7. Локальная сборка без Docker (опционально)

```bash
# Backend
npm ci
npm run build
export DATABASE_PATH=/var/lib/dimetra/prod.db
mkdir -p /var/lib/dimetra
node dist/index.js

# Frontend (API на том же хосте)
cd frontend
VITE_API_URL= npm run build
# dist/ отдайте через nginx с proxy /api → localhost:3000
```

Скрипты в корне:

- `npm run build` — компиляция бэкенда в `dist/`
- `npm run build:frontend` — сборка фронта в `frontend/dist/`
- `npm run build:all` — оба
- `npm start` — `node dist/index.js`

---

## 8. Резервное копирование БД

```bash
docker compose exec backend sh -c 'cp /data/prod.db /data/prod.db.bak.$(date +%F)'
docker cp dimetra-backend-1:/data/prod.db ./prod.db.backup
```

(Имя контейнера уточните через `docker compose ps`.)

---

## 9. Устранение неполадок

| Симптом | Что проверить |
|---------|----------------|
| Бот не отвечает | `docker compose logs backend`, `BOT_TOKEN`, доступ к `api.telegram.org` |
| Mini App не открывается | `WEB_APP_URL` = HTTPS, сертификат, порт 443 |
| Пустой экран / ошибка API | `curl http://127.0.0.1/api/catalog`, логи backend |
| 502 от nginx | `docker compose ps`, health backend |
| Данные пропали | том `docker volume ls`, не удаляйте `dimetra-data` |

---

## Структура Docker

- `Dockerfile.backend` — TypeScript → `dist/`, Node 22, SQLite в `/data`
- `Dockerfile.frontend` — Vite build → nginx
- `docker-compose.yml` — сервисы `backend` + `frontend`, volume `dimetra-data`
- `docker/nginx/default.conf` — статика + `proxy_pass` на `/api/` и `/health`
