# АРХИТЕКТУРА И СПЕЦИФИКАЦИЯ ПРОЕКТА CHEERDUCK

## 1. Стек технологий
- **Backend**:
  - Язык: Python 3.12
  - Фреймворк API: FastAPI (асинхронный, быстрый, автоматическая документация OpenAPI/Swagger)
  - Telegram Bot: Aiogram 3.x (вебхуки / пуш-уведомления)
  - База данных: PostgreSQL (локально для старта можно SQLite / PostgreSQL через Docker)
  - ORM: SQLAlchemy 2.0 (asyncio) + Alembic для миграций
  - Валидация данных: Pydantic v2
- **Frontend**:
  - Язык: TypeScript
  - Фреймворк: React + Vite
  - Стилизация: Tailwind CSS + официальные токены Telegram WebApp
  - Шрифты: Montserrat Medium (заголовки H1–H3) + Roboto (текст, подписи, кнопки),
    self-hosted через `@fontsource` (сабсеты cyrillic + latin, без внешних CDN)
  - Telegram SDK: `@telegram-apps/sdk-react` (или нативный `window.Telegram.WebApp`)
  - Иконки: Lucide React (легкие, современные)

## 2. Модель данных (Сущности MVP)

### User (Пользователь)
- `id`: BigInteger (Telegram ID, первичный ключ)
- `username`: String (юзернейм в TG, nullable)
- `first_name`: String
- `last_name`: String (nullable)
- `photo_url`: String (nullable)
- `city`: String (город обмена, по умолчанию пустой или выбранный пользователем)
- `is_banned`: Boolean (для модерации, default: False)
- `created_at`: DateTime

### Item (Предмет для обмена)
- `id`: Integer / UUID (первичный ключ)
- `user_id`: BigInteger (внешний ключ -> User.id)
- `title`: String (название предмета, до 80 символов)
- `description`: Text (описание состояния, нюансов)
- `condition`: String (Новое, Отличное, Хорошее, Требует ремонта)
- `wishlist`: String (На что хочет обменяться автор)
- `images`: JSON / Array of Strings (список ссылок на фото)
- `city`: String (город лота)
- `status`: Enum (`active`, `in_deal`, `swapped`, `on_moderation`, `rejected`)
- `created_at`: DateTime
- `updated_at`: DateTime

### SwapOffer (Предложение обмена)
- `id`: Integer / UUID (первичный ключ)
- `sender_id`: BigInteger (кто предлагает)
- `recipient_id`: BigInteger (кому предлагают, владелец целевого предмета)
- `offered_item_id`: Integer / UUID (что предлагают)
- `target_item_id`: Integer / UUID (на что хотят обменяться)
- `comment`: Text (комментарий к предложению)
- `status`: Enum (`pending`, `accepted`, `rejected`, `cancelled`, `completed`)
- `created_at`: DateTime
- `updated_at`: DateTime
