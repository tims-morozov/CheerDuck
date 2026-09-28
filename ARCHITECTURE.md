# АРХИТЕКТУРА И СПЕЦИФИКАЦИЯ ПРОЕКТА CHEERDUCK

> Рабочий документ для разработчиков и ИИ-агентов. Описывает **фактическое** состояние MVP
> на 28.09.2026. Если текст расходится с кодом — источник истины код, а расхождение нужно
> устранить правкой этого файла (это часть готовности задачи). История изменений по этапам —
> в `PROJECT_STATUS.md`, правила работы — в `.cursorrules`; оба файла ведутся **локально** и
> в репозиторий не публикуются (см. `.gitignore`).

## 1. Стек технологий (фактический)

### Backend — `apps/backend`
- Python 3.12, FastAPI. Swagger — `/api/docs`, OpenAPI — `/api/openapi.json`
- Запуск: `uvicorn main:app --reload` (порт 8000)
- ORM: SQLAlchemy 2.0 async (`Mapped` / `mapped_column`), сессии — `async_sessionmaker`
- БД: **SQLite** — `sqlite+aiosqlite:///./cheerduck.db` (файл `apps/backend/cheerduck.db`).
  `asyncpg` есть в `requirements.txt` как заготовка под PostgreSQL, но не используется
- Валидация и настройки: Pydantic v2 + `pydantic-settings` (`.env`, шаблон — `.env.example`)
- **Миграций нет**: Alembic не подключён (нет в `requirements.txt`, нет `alembic.ini` / `versions/`).
  Таблицы создаются на старте: `Base.metadata.create_all` в `lifespan` (`main.py`).
  Следствие: изменение модели **не** меняет уже существующую БД — нужна ручная миграция
  или пересоздание файла БД
- Telegram-бот: aiogram 3 (`app/bot/bot.py`). **К приложению не подключён**: `main.py` его не
  импортирует, `send_swap_notification()` нигде не вызывается — код есть, уведомления не уходят

### Frontend — `apps/frontend`
- React 19 + TypeScript 6, сборка Vite 8; тип-чек `tsc -b` входит в `npm run build`
- Tailwind CSS v4 через `@tailwindcss/vite` (файла конфига нет: токены — в `@theme` в `src/index.css`)
- Палитра — **своя** (CSS-переменные `--bg-*`, `--accent-lime`); переменные темы Telegram
  (`--tg-theme-*`) не используются
- Шрифты self-hosted: `@fontsource/montserrat` (500) + `@fontsource/roboto` (400/500/700),
  только сабсеты cyrillic + latin; шкала H1/H2/H3/P — в `src/index.css`
- Иконки: `lucide-react`
- Telegram SDK: официальный скрипт `telegram-web-app.js` в `index.html` + свой хук
  `src/hooks/useTelegram.ts` (haptic / close / ready). Пакет `@telegram-apps/sdk-react` не используется
- Линтер: `oxlint`. Автотестов нет — проверка = `npm run build` + `npm run lint` + ручной смоук
- Dev-сервер проксирует `/api` и `/uploads` на `http://localhost:8000` (`vite.config.ts`),
  поэтому в коде используются **относительные** пути

## 2. Модель данных (сущности MVP)

Модели — `apps/backend/app/models/*.py`, Pydantic-схемы — `apps/backend/app/schemas/schemas.py`,
TypeScript-типы — `apps/frontend/src/types/index.ts`. Меняя поле, синхронизируй все три места.

### User — таблица `users`
- `id`: BigInteger, первичный ключ (= Telegram ID)
- `username`: String(64), nullable
- `first_name`: String(128)
- `last_name`: String(128), nullable
- `photo_url`: String(512), nullable
- `city`: String(100), default `Москва`, индекс (город обмена)
- `is_banned`: Boolean, default `false` — в API пока не используется
- `created_at`: DateTime

### Item — таблица `items`
- `id`: Integer, первичный ключ (autoincrement)
- `user_id`: BigInteger, FK → `users.id` (ON DELETE CASCADE), индекс
- `title`: String(120); в UI ограничено `maxLength={80}`, в Pydantic-схеме лимита нет
- `description`: Text
- `condition`: String(64) — в UI значения `['Новое', 'Отличное', 'Хорошее', 'С нюансами']`;
  бэкенд значение не валидирует (обычная строка)
- `wishlist`: String(255) NOT NULL — **«спящее» поле**: из формы убрано (этап 9), пишется пустая строка
- `images`: JSON (массив строк) — **относительные** URL вида `/uploads/<uuid>.<ext>`
- `city`: String(100), индекс (город лота)
- `status`: Enum `active / in_deal / swapped / on_moderation / rejected`, default `active`.
  Фактически API выставляет только `active` и `in_deal` (при принятии оффера); остальные значения никем не устанавливаются
- `category`: String(64) NOT NULL, default `Другое` — **«спящее» поле**: из UI, API и схем удалено (этап 8),
  колонка оставлена, чтобы старые записи и `INSERT` не падали на `NOT NULL` (миграций нет).
  **Не удалять без миграции**
- `created_at`, `updated_at`: DateTime

### SwapOffer — таблица `swap_offers`
- `id`: Integer, первичный ключ (autoincrement)
- `sender_id`, `recipient_id`: BigInteger, FK → `users.id`, индексы
- `offered_item_id`, `target_item_id`: FK → `items.id` (ON DELETE CASCADE), индексы
- `comment`: Text, nullable
- `status`: Enum `pending / accepted / rejected / cancelled / completed`, default `pending`.
  Фактически используются `pending`, `accepted`, `rejected`; `cancelled` и `completed` не выставляются
  (эндпоинтов отмены/завершения нет)
- `created_at`, `updated_at`: DateTime
- Связи: `offered_item`, `target_item`, `sender`, `recipient`

## 3. REST API

- Префикс прикладных роутов — `/api/v1` (`settings.API_V1_PREFIX`); сами роуты — `app/api/endpoints.py`,
  бизнес-логика — `app/services/*`
- Авторизация: заголовок `Authorization: tma <initData>` (HMAC-проверка, см. раздел 5).
  В `DEBUG_MODE=True` при отсутствии заголовка подставляется тестовый пользователь `id=99999999`

| Метод | Путь | Назначение | Авторизация |
| --- | --- | --- | --- |
| GET | `/users/me` | профиль (создаётся при первом обращении) | да |
| PATCH | `/users/me/city` | смена домашнего города | да |
| GET | `/items/feed` | лента активных лотов, фильтр `?city=` | нет |
| GET | `/items/my` | лоты текущего пользователя | да |
| GET | `/items/{item_id}` | карточка лота | нет |
| POST | `/items` | публикация лота | да |
| POST | `/uploads` | загрузка 1–5 фото (multipart, поле `files`) | да |
| POST | `/swaps` | создать предложение обмена | да |
| GET | `/swaps` | список офферов, `?offer_type=incoming` (вариант `outgoing`) | да |
| POST | `/swaps/{offer_id}/respond` | ответ на оффер, `?accept=true` (вариант `false`) | да |

Служебное: `GET /health`, статика фото `/uploads/<filename>`, документация `/api/docs`.

Особенности: пагинация в `ItemService.get_feed()` есть (`limit=50`, `offset=0`), но из API не
пробрасывается. Новые эндпоинты добавлять только в связке «роут → сервис», без логики в роуте.

## 4. Фото предметов: загрузка и хранение

- `POST /api/v1/uploads` — `List[UploadFile]` в поле `files`, 1–5 файлов за раз (`MAX_IMAGES = 5`)
- Файлы сохраняются в `UPLOAD_DIR = uploads` (каталог создаётся на старте в `main.py`), имя генерируется
  как `uuid4().hex` + расширение — защита от коллизий и path traversal; раздаются статикой `/uploads/...`
- В БД и на фронтенд попадают **только относительные** URL (иначе записи прилипнут к домену)
- Лимиты (`app/core/config.py`): `MAX_UPLOAD_SIZE = 10 МБ` на файл,
  `ALLOWED_IMAGE_TYPES` = JPEG / PNG / WEBP / GIF (MIME → расширение)
- Проверка формата = доверие к `Content-Type`, а если он отсутствует или неизвестен — к расширению
  имени файла. **Сигнатура содержимого не проверяется**: текстовый файл с именем `photo.png` будет
  принят и сохранён (проверено смоук-тестом 28.09.2026). Это известное ограничение, см. раздел 7
- Ошибки: неверный формат / размер / больше 5 файлов → `400`; пустой запрос → `422` от FastAPI
- Каталог `uploads/` в `.gitignore` — загруженные фото не коммитятся

## 5. Безопасность и приватность

- Telegram `initData` проверяется HMAC-SHA256 (`app/core/security.py`): секрет = HMAC от `BOT_TOKEN`
  с ключом `WebAppData`, строка проверки — отсортированные пары `key=value`. Несовпадение хэша → `401`
- ⚠️ `DEBUG_MODE` по умолчанию `True` (`config.py`) — без заголовка `Authorization` API отвечает
  под тестовым пользователем. **В продакшене обязательно `DEBUG_MODE=False`**
- ⚠️ Значения по умолчанию для прода нужно переопределить: `BOT_TOKEN` (`YOUR_BOT_TOKEN_HERE` — с ним
  подпись `initData` фактически не защищает) и `CORS_ORIGINS = ["*"]`
- Контакты: `contact_username` в `SwapOut` заполняется **только** когда статус оффера `accepted`;
  до этого фронтенд видит участников без username
- Хранимые ПДн — минимум, необходимый для свопа: Telegram ID, имя/фамилия, username, ссылка на аватар, город
- Rate limiting, антифлуд и админ-модерация отсутствуют

## 6. Договорённости, которые легко сломать

- `items.category` и `items.wishlist` — «спящие»: не удалять без миграции (SQLite не снимает `NOT NULL`
  без пересоздания таблицы). То же про неиспользуемые значения `ItemStatus.on_moderation` / `rejected`
- `condition` — свободная строка. Если понадобится enum или фильтр, менять сразу три слоя: UI-константу,
  Pydantic-схему и модель БД — и обновлять этот файл
- `title`: лимит 80 символов задан только в UI; перенос лимита в схему (`max_length=80`) начнёт отдавать
  `422` на прямые запросы к API
- `grid-cols-5` в `CreateItemPage.tsx` — литерал, обязан совпадать с `MAX_PHOTOS`
  (Tailwind не собирает классы из переменных)
- Новые API-пути и статические каталоги сразу добавлять в `server.proxy` (`vite.config.ts`)
- Контракт «бэкенд ↔ фронтенд» держать синхронным: `schemas.py` ↔ `types/index.ts` ↔ `client.ts`

## 7. Известные ограничения и открытые задачи (на 28.09.2026)

- Telegram-бот не подключён (`main.py` его не импортирует), `send_swap_notification()` не вызывается —
  push-уведомления не отправляются
- Класс `pb-safe` (`Navigation.tsx`) нигде не определён → нижнее меню не учитывает safe-area экранов iPhone
- Нет проверки сигнатуры загружаемых изображений, нет сжатия и ресайза
- В карточке лота показывается только первое фото — галереи и листания нет
- Кнопка «Жалоба» (`ItemDetailPage.tsx`) — локальный UI-стейт (тост), на бэкенд ничего не уходит;
  статусы `on_moderation` / `rejected` никем не выставляются
- Нет автотестов, нет пагинации в API, нет удаления/редактирования лота, нет отмены и завершения оффера
- `is_banned` не влияет на доступ к приложению

Полный список с приоритетами — в конце `PROJECT_STATUS.md` (локальный файл, см. `.gitignore`).
