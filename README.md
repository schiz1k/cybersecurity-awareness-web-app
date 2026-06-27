# Cyber Arena

Русскоязычное веб-приложение для просвещения пользователей по теме
кибербезопасности.

Проект подготовлен как выпускная квалификационная работа для Тольяттинской
академии управления, 2026 год.

## Что внутри

- React/Vite frontend;
- Express API;
- PostgreSQL модель данных;
- учебные материалы по кибербезопасности;
- тесты и интерактивные задания;
- рейтинг пользователей;
- профиль пользователя;
- административный раздел для управления контентом.

## Быстрый старт

Установить зависимости:

```bash
npm install
```

Запустить frontend:

```bash
npm run dev
```

По умолчанию Vite откроет локальный адрес вида:

```text
http://localhost:5173
```

## Backend и PostgreSQL

Поднять PostgreSQL в Docker:

```bash
npm run db:up
```

Запустить API:

```bash
npm run dev:api
```

API по умолчанию:

```text
http://localhost:4000/api
```

Переменные окружения описаны в `.env.example`.

Важно:

- frontend умеет работать с API;
- если backend/PostgreSQL недоступны, часть контента берётся из seed-данных;
- файл `.env` не хранится в репозитории.

## Где редактировать страницы

- Главная: `src/pages/HomePage.tsx`
- Тесты: `src/pages/TestsPage.tsx`
- Один тест: `src/pages/TestDetailPage.tsx`
- Материалы: `src/pages/MaterialsPage.tsx`
- Один материал: `src/pages/MaterialDetailPage.tsx`
- Вход: `src/pages/LoginPage.tsx`
- Регистрация: `src/pages/RegisterPage.tsx`
- Рейтинг: `src/pages/LeaderboardPage.tsx`
- Профиль: `src/pages/ProfilePage.tsx`
- Админка: `src/pages/AdminPage.tsx`

## Документация

- `docs/project-passport.md` - паспорт проекта для ВКР;
- `docs/requirements.md` - требования к проекту;
- `docs/deployment.md` - запуск и размещение;
- `docs/SITE_PRODUCT_DOCUMENTATION.md` - продуктовая документация;
- `docs/ARCHITECTURE.md` - архитектура;
- `docs/POSTGRESQL_DATA_MODEL.md` - модель данных PostgreSQL;
- `PROJECT_DOCUMENTATION.md` - документация по локальной админке.
