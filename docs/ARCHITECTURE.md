# Архитектура проекта

## Цель

Сделать проект понятным по коду, оставить публичный сайт только для просмотра и тренировок, а управление контентом и пользовательскими данными держать в backend с PostgreSQL.

## Как теперь устроен проект

```text
src/
  app/
    AppProviders.tsx     # Глобальные провайдеры состояния
    AppRouter.tsx        # Все маршруты сайта
    adminAccess.ts       # Проверка, можно ли открывать /admin с текущего host
  components/
    Layout.tsx           # Общий layout сайта
    ...                  # Переиспользуемые UI-блоки
  config/
    navigation.ts        # Центральный список пунктов меню
  data/
    siteData.ts          # Базовый демо-набор контента и fallback
  hooks/
    useContentState.tsx    # Контент через API с fallback на seed
    usePlatformState.tsx   # Профиль/попытки через API
    useLeaderboardState.tsx # Лидерборд через API
  pages/
    HomePage.tsx
    TestsPage.tsx
    TestDetailPage.tsx
    MaterialsPage.tsx
    MaterialDetailPage.tsx
    LeaderboardPage.tsx
    ProfilePage.tsx
    AdminPage.tsx
  utils/
    platform.ts
    contentAdmin.ts

server/
  src/
    app.ts               # Инициализация Express
    index.ts             # Запуск API
    config/env.ts        # Переменные окружения
    db/
      pool.ts            # Подключение к PostgreSQL
      schema.sql         # Схема БД
      seed.sql           # Базовые данные при первом старте контейнера
      seed-demo.ts       # Повторное наполнение демонстрационной базы
    http/
      asyncHandler.ts    # Обёртка для async routes
      localAccess.ts     # Ограничение локального админского доступа
    modules/
      content/           # Тесты и материалы
      users/             # Регистрация пользователей
      leaderboard/       # Лидерборд
```

## Где редактировать страницы через код

Это главный ответ на ваш вопрос.

- Главная страница: `src/pages/HomePage.tsx`
- Каталог тестов: `src/pages/TestsPage.tsx`
- Страница одного теста: `src/pages/TestDetailPage.tsx`
- Каталог материалов: `src/pages/MaterialsPage.tsx`
- Страница материала: `src/pages/MaterialDetailPage.tsx`
- Лидерборд: `src/pages/LeaderboardPage.tsx`
- Профиль пользователя: `src/pages/ProfilePage.tsx`
- Админка: `src/pages/AdminPage.tsx`
- Общий header/footer/layout: `src/components/Layout.tsx`
- Маршруты всех страниц: `src/app/AppRouter.tsx`
- Меню навигации: `src/config/navigation.ts`

Важно:

- пункт `Админ` убран из публичного меню
- маршрут `/admin` открывается только локально
- если открыть публичный домен с `/#/admin`, произойдёт редирект на главную

## Где менять контент

Теперь рабочий путь такой:

1. UI админки:
   - `src/pages/AdminPage.tsx`
2. Клиентский слой API:
   - `src/hooks/useContentState.tsx`
3. Backend CRUD:
   - `server/src/modules/content/content.routes.ts`
   - `server/src/modules/content/content.repository.ts`
4. PostgreSQL:
   - `server/src/db/schema.sql`

Источник истины в текущей архитектуре:

- `server/src/db/schema.sql`
- PostgreSQL
- API из `server/src/modules/*`

`src/data/siteData.ts` используется как fallback на фронтенде и как базовый набор для команды `npm run db:seed:demo`, а не как постоянный источник истины.

## Правило дальнейшей архитектуры

Что должно жить во фронтенде:

- layout
- визуальные компоненты
- клиентская навигация
- локальные UI-состояния
- временные анимации и интерактив интерфейса
- guard логики доступа к локальной админке

Что должно жить в backend/PostgreSQL:

- пользователи
- регистрация
- тесты
- вопросы и варианты ответов
- результаты прохождений
- прогресс материалов
- закладки
- лидерборды
- команды
- любые данные, которые должны быть единым источником истины

## Что нужно сделать следующим этапом

1. Добавить полноценную авторизацию вместо demo-user механики.
2. Разделить публичные и административные API по ролям.
3. Убрать fallback на seed-данные после стабилизации backend.
4. Добавить отдельные API для CRUD команд, вопросов и пользовательских сессий.
