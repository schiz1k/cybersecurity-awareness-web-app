# Запуск и размещение

## Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить frontend:

```bash
npm run dev
```

Запустить API:

```bash
npm run dev:api
```

## PostgreSQL

Поднять локальную базу данных через Docker Compose:

```bash
npm run db:up
```

Остановить базу:

```bash
npm run db:down
```

Посмотреть логи:

```bash
npm run db:logs
```

Заполнить базу демонстрационными данными:

```bash
npm run db:seed:demo
```

## Переменные окружения

Пример находится в `.env.example`.

Основные переменные:

- `VITE_API_URL` - адрес API для frontend;
- `PORT` - порт backend;
- `DATABASE_URL` - строка подключения PostgreSQL;
- `CORS_ORIGIN` - разрешённые origins для frontend;
- `DATABASE_SSL` - режим SSL для подключения к базе.

Файл `.env` не должен попадать в репозиторий.

## Сборка

Проверить production-сборку:

```bash
npm run build
```

Локально посмотреть собранный frontend:

```bash
npm run preview
```

## Размещение

Frontend можно разместить на Vercel, Netlify или VPS.

Backend и PostgreSQL требуют окружения, где можно запустить Node.js API и базу
данных. Для VPS-публикации нужно отдельно настроить:

- переменные окружения;
- reverse proxy;
- процесс-менеджер для API;
- резервное копирование базы;
- HTTPS.

## Контрольный список

- `npm install` проходит без ошибок;
- `npm run build` завершается успешно;
- frontend открывается локально;
- API отвечает по `/api`;
- база данных поднимается через Docker Compose;
- `.env` не добавлен в Git;
- `node_modules`, `dist`, `logs` и системные файлы не попали в репозиторий.
