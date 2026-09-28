# CheerDuck — Frontend (Mini App)

Клиентская часть Telegram Mini App **CheerDuck** (обмен вещами по принципу своп).
Общее описание проекта, запуск backend и подключение к Telegram — в [корневом README](../../README.md).

## Стек

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `lucide-react` — иконки
- `@fontsource/montserrat`, `@fontsource/roboto` — self-hosted шрифты (без внешних CDN)

## Скрипты

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Дев-сервер Vite с HMR (по умолчанию http://localhost:5173) |
| `npm run build` | Тип-чек (`tsc -b`) + продакшн-сборка в `dist/` |
| `npm run lint` | Линтер `oxlint` |
| `npm run preview` | Предпросмотр собранного `dist/` |

## Структура `src/`

- `pages/` — экраны: лента, публикация лота, свопы, профиль, карточка лота
- `components/` — переиспользуемые UI-компоненты
- `hooks/` — `useTelegram` (Telegram WebApp SDK, Haptic Feedback)
- `api/` — клиент REST API
- `index.css` — дизайн-токены (`@theme`) и базовая типографика

## Загрузка фотографий

- Пользователь выбирает 1–5 файлов (`<input type="file" multiple accept="image/*">`), они уходят на `POST /api/v1/uploads` (multipart, поле `files`) через `api.uploadImages()`. Это отдельный метод на `fetch` + `FormData`: общий `request()` всегда ставит `Content-Type: application/json`
- Бэкенд возвращает **относительные** URL `/uploads/<uuid>.<ext>`; они передаются в `images` при создании лота
- Лимиты заданы на бэкенде (`apps/backend/app/core/config.py`): до 5 фото, до 10 МБ на файл, форматы JPEG/PNG/WEBP/GIF. Сигнатура содержимого не проверяется — контроль по `Content-Type` (а без него — по расширению имени файла)
- В dev-режиме `/api` и `/uploads` проксируются на `http://localhost:8000` (`vite.config.ts`): без запущенного бэкенда превью фото не откроются
- В UI число ячеек задано литералом `grid-cols-5` (`CreateItemPage.tsx`) — он обязан совпадать с `MAX_PHOTOS`, так как Tailwind не собирает классы из переменных

## Документация

- `ARCHITECTURE.md` — стек, модель данных, REST API, загрузка фото, безопасность; файл локальный, в репозиторий не попадает
- `PROJECT_STATUS.md` — журнал этапов и открытых задач; файл локальный, в репозиторий не попадает
