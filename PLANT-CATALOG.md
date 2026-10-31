# База растений (FloralWorld)

Каталог хранится в PostgreSQL (**`plant_catalog`**). При первом запуске пустая таблица наполняется из **`data/plant-catalog.json`** (или из 5 legacy-профилей, если JSON нет).

## Импорт с сайта

Источник: [энциклопедия комнатных растений FloralWorld](https://floralworld.ru/encyclopedia/catalogue.html).

```bash
npm install
npm run catalog:scrape:sample   # первые 40 статей (проверка)
npm run catalog:scrape          # полный каталог (может занять 10–20 мин)
```

Скрипт: `scripts/scrape-floralworld-catalog.ts`

- парсит `catalogue.html` и страницы `encyclopedia/plants/*.html`;
- сохраняет описание, блок «характеристики» (свет, полив, подкормка…), фото, ссылку на статью;
- **интервалы полива/подкормки** для приложения выводятся эвристикой из текста (`deriveCareIntervals.ts`).

После импорта JSON в уже существующую БД:

```bash
npm run catalog:sync-db              # только новые id
npm run catalog:sync-db -- --update  # обновить все поля из JSON
npm run catalog:import               # scrape + sync --update
```

Редактирование — вкладка **Справочник** в Mini App или `GET/POST/PUT/DELETE /api/encyclopedia`.

## Правовая оговорка

Материалы принадлежат правообладателям FloralWorld. JSON предназначен для личного использования в Dimetra; при публикации приложения уточните условия использования контента у сайта.
