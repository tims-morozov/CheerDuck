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

## Документация

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — архитектура и безопасность
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) — статус и история этапов
