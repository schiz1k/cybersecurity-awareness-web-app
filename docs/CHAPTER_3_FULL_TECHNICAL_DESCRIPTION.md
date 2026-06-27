# Глава 3. Реализация веб-приложения Cyber Arena

Документ описывает реализацию веб-приложения Cyber Arena по клиентской части, серверной части, тестированию, информационной безопасности, запуску, сопровождению и документации. Текст подготовлен для передачи руководству, преподавателю, ChatGPT и команде разработки.

Стиль документа: технический. В документ включены фрагменты кода из текущего проекта и примеры кода для тех частей, которые в проекте отсутствуют или реализованы частично.

Текущий стек:

- React 19;
- TypeScript;
- Vite;
- React Router;
- Express 5;
- PostgreSQL 16;
- Zod;
- Docker Compose;
- ESLint.

Основные каталоги:

```text
src/                 клиентская часть
server/src/          серверная часть
server/src/db/       SQL-схема, seed-данные, подключение к PostgreSQL
docs/                документация проекта
public/              статические ресурсы
dist/                production-сборка frontend
```

## 3.1 Реализация клиентской части веб-приложения

Клиентская часть реализована как SPA-приложение на React и TypeScript. Сборка выполняется через Vite. Навигация реализована на стороне клиента через `HashRouter`, поэтому маршруты имеют формат `/#/tests`, `/#/materials`, `/#/profile`.

### 3.1.1 Структура клиентской части

Основные файлы и каталоги:

```text
src/main.tsx                         точка входа React
src/App.tsx                          корневой компонент
src/app/AppRouter.tsx                маршрутизация
src/app/AppProviders.tsx             глобальные провайдеры
src/app/adminAccess.ts               проверка локального доступа к админке
src/components/Layout.tsx            общий layout
src/components/games/                интерактивные тренажеры
src/config/api.ts                    конфигурация API и session token
src/config/navigation.ts             пункты навигации
src/hooks/useContentState.tsx        состояние тестов и материалов
src/hooks/usePlatformState.tsx       пользователь, профиль, попытки, закладки
src/hooks/useLeaderboardState.tsx    рейтинг
src/pages/                           страницы приложения
src/utils/api.ts                     HTTP-клиент
src/utils/platform.ts                расчеты профиля и попыток
```

Клиентская часть разделена на страницы, компоненты, хуки и утилиты. Страницы отвечают за отображение маршрутов. Хуки отвечают за загрузку данных и работу с состоянием. Утилиты содержат функции, которые не зависят от React-компонентов.

### 3.1.2 Подключение глобальных провайдеров

В приложении используется несколько контекстов. Они подключаются в `src/app/AppProviders.tsx`.

Фактический код:

```tsx
import { ContentProvider } from '../hooks/useContentState'
import { LeaderboardProvider } from '../hooks/useLeaderboardState'
import { PlatformProvider } from '../hooks/usePlatformState'
import { ThemeProvider } from '../hooks/useTheme'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ContentProvider>
        <LeaderboardProvider>
          <PlatformProvider>{children}</PlatformProvider>
        </LeaderboardProvider>
      </ContentProvider>
    </ThemeProvider>
  )
}
```

Назначение провайдеров:

- `ThemeProvider` - управление темой интерфейса;
- `ContentProvider` - получение тестов и материалов;
- `LeaderboardProvider` - получение рейтинга;
- `PlatformProvider` - работа с текущим пользователем, попытками, закладками и прогрессом.

Такой подход исключает дублирование запросов на уровне отдельных страниц. Данные загружаются централизованно и доступны через пользовательские хуки.

### 3.1.3 Маршрутизация

Маршруты определены в `src/app/AppRouter.tsx`.

Фактический код:

```tsx
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isLocalAdminHost } from './adminAccess'
import { Layout } from '../components/Layout'
import { AdminPage } from '../pages/AdminPage'
import { HomePage } from '../pages/HomePage'
import { LeaderboardPage } from '../pages/LeaderboardPage'
import { LoginPage } from '../pages/LoginPage'
import { MaterialDetailPage } from '../pages/MaterialDetailPage'
import { MaterialsPage } from '../pages/MaterialsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { TestDetailPage } from '../pages/TestDetailPage'
import { TestsPage } from '../pages/TestsPage'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:slug" element={<TestDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/:slug" element={<MaterialDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={isLocalAdminHost() ? <AdminPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
```

Реализованные пользовательские маршруты:

- `/` - главная страница;
- `/tests` - каталог тренировок;
- `/tests/:slug` - страница конкретного теста;
- `/leaderboard` - рейтинг;
- `/materials` - каталог материалов;
- `/materials/:slug` - страница материала;
- `/login` - вход;
- `/register` - регистрация;
- `/profile` - профиль;
- `/admin` - локальная административная панель.

Все неизвестные маршруты перенаправляются на главную страницу.

Административный маршрут проверяется на клиенте. Если host не локальный, вместо `AdminPage` выполняется redirect на `/`.

### 3.1.4 Навигация

Публичные пункты меню определены в `src/config/navigation.ts`.

Фактический код:

```ts
export interface NavigationLink {
  to: string
  label: string
}

export const navigationLinks: NavigationLink[] = [
  { to: '/', label: 'Главная' },
  { to: '/tests', label: 'Тренировки' },
  { to: '/leaderboard', label: 'Рейтинг' },
  { to: '/materials', label: 'Материалы' },
  { to: '/profile', label: 'Профиль' },
]
```

Административная панель не включена в публичную навигацию. Это снижает вероятность случайного перехода пользователя в служебный раздел.

### 3.1.5 Конфигурация API и хранение session token

Клиент получает адрес API из переменной окружения `VITE_API_URL`. Если переменная не задана, используется локальное значение.

Фактический код из `src/config/api.ts`:

```ts
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export const SESSION_TOKEN_STORAGE_KEY = 'cyber-arena-session-token'

export function getStoredSessionToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)
}

export function setStoredSessionToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
  }
}

export function clearStoredSessionToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
  }
}
```

Текущая реализация хранит session token в `localStorage`. Это технически просто, но для production-среды безопаснее использовать HttpOnly Secure cookie.

Рекомендуемая production-реализация:

```ts
// frontend не читает токен напрямую
await fetch(`${API_URL}/users/login`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
```

```ts
// backend устанавливает cookie
response.cookie('session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
})
```

В текущем проекте cookie не реализованы. Для учебной версии используется Bearer token.

### 3.1.6 HTTP-клиент

HTTP-клиент расположен в `src/utils/api.ts`.

Фактический код:

```ts
import { API_URL, getStoredSessionToken } from '../config/api'

interface ApiRequestOptions {
  omitAuth?: boolean
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions) {
  const token = getStoredSessionToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(options?.omitAuth || !token ? {} : { Authorization: `Bearer ${token}` }),
    },
  })

  return parseResponse<T>(response)
}
```

Для POST, PUT, PATCH, DELETE используется `apiSend`:

```ts
export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  options?: ApiRequestOptions,
) {
  const token = getStoredSessionToken()
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.omitAuth || !token ? {} : { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return parseResponse<T>(response)
}
```

Назначение:

- централизованно формировать URL API;
- добавлять Bearer token;
- обрабатывать `204 No Content`;
- превращать неуспешные HTTP-ответы в исключения.

Ограничение текущей реализации: ошибки возвращаются как строка JSON, без типизированного объекта ошибки. Рекомендуемый вариант:

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`API request failed with status ${status}`)
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new ApiError(response.status, payload)
  }

  return payload as T
}
```

### 3.1.7 Состояние контента

Контент загружается через `useContentState.tsx`. Контент включает тесты и материалы.

Фактическая логика:

```tsx
const defaultBundle: ContentBundle = {
  tests: seedTests,
  materials: seedMaterials,
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<ContentBundle>(defaultBundle)

  const refreshBundle = async () => {
    try {
      const next = await apiGet<ContentBundle>('/content/bundle')
      if (next.tests.length || next.materials.length) {
        setBundle(next)
      } else {
        setBundle(defaultBundle)
      }
    } catch {
      setBundle(defaultBundle)
    }
  }

  useEffect(() => {
    void refreshBundle()
  }, [])
}
```

Рабочий алгоритм:

1. При запуске frontend запрашивает `/api/content/bundle`.
2. Если сервер доступен, используются данные PostgreSQL.
3. Если сервер недоступен, используется `src/data/siteData.ts`.
4. Админка вызывает методы сохранения и удаления контента.

Методы изменения контента:

```tsx
saveTest: async (test, previousSlug) => {
  const saved = await apiSend<CyberTest>(
    previousSlug ? `/content/tests/${previousSlug}` : '/content/tests',
    previousSlug ? 'PUT' : 'POST',
    test,
  )

  setBundle((current) => ({
    ...current,
    tests: [saved, ...current.tests.filter((item) => item.slug !== (previousSlug ?? test.slug))],
  }))
}
```

Назначение:

- создать тест через `POST /content/tests`;
- обновить тест через `PUT /content/tests/:slug`;
- синхронизировать локальное состояние после ответа API.

Ограничение: при ошибке API пользователь получает только общее сообщение. Для production нужна система уведомлений с конкретным текстом ошибки.

### 3.1.8 Состояние пользователя

Пользовательское состояние реализовано в `usePlatformState.tsx`.

Объект состояния:

```ts
const defaultState: PlatformState = {
  accountEmail: '',
  learnerName: 'Ваш профиль',
  role: 'Cybersecurity Team',
  completedMaterials: [],
  bookmarkedMaterials: [],
  attempts: [],
}
```

При запуске приложения выполняется восстановление сессии:

```tsx
const refreshState = async () => {
  const storedToken = getStoredSessionToken() ?? ''
  setHasRegisteredAccount(Boolean(storedToken))

  if (!storedToken) {
    setCurrentUserEmail('')
    setState(defaultState)
    return
  }

  try {
    const nextState = await apiGet<PlatformState>('/users/current/state')
    setState(nextState)
    setCurrentUserEmail(nextState.accountEmail)
  } catch {
    clearStoredSessionToken()
    setCurrentUserEmail('')
    setHasRegisteredAccount(false)
    setState(defaultState)
  }
}
```

Если token отсутствует, используется гостевое состояние. Если token есть, frontend запрашивает состояние пользователя. Если сервер возвращает ошибку, token удаляется.

Регистрация:

```tsx
registerUser: async (payload) => {
  const session = await apiSend<AuthSessionResponse>(
    '/users/register',
    'POST',
    payload,
    { omitAuth: true },
  )
  setStoredSessionToken(session.sessionToken)
  setCurrentUserEmail(session.state.accountEmail)
  setHasRegisteredAccount(true)
  setState(session.state)
  await refreshLeaderboard()
}
```

Сохранение попытки:

```tsx
saveAttempt: async (attempt) => {
  if (!ensureRegisteredAccount()) {
    return
  }

  const next = await apiSend<PlatformState>(
    `/users/current/tests/${attempt.testSlug}/attempts`,
    'POST',
    {
      score: attempt.score,
      label: attempt.label,
      summary: attempt.summary,
    },
  )
  setState(next)
  setCurrentUserEmail(next.accountEmail)
  await refreshLeaderboard()
}
```

Если пользователь не вошел, `ensureRegisteredAccount` перенаправляет его на страницу входа.

### 3.1.9 Реализация страницы теста

Страница теста находится в `src/pages/TestDetailPage.tsx`.

Основная логика:

```tsx
const { slug } = useParams()
const { tests } = useContentState()
const { state, saveAttempt } = usePlatformState()
const test = tests.find((item) => item.slug === slug)

if (!test) {
  return <Navigate to="/tests" replace />
}

const attempts = state.attempts.filter((attempt) => attempt.testSlug === test.slug)
const bestAttempt = getBestAttempt(test.slug, state.attempts)

const persistAttempt = (score: Parameters<typeof createAttempt>[1]) => {
  saveAttempt(createAttempt(test, score))
}
```

Выбор компонента тренажера выполняется по `test.mode`:

```tsx
{test.mode === 'reflex' ? (
  <ReflexDrill bestScore={bestAttempt?.score} onComplete={persistAttempt} />
) : null}
{test.mode === 'sequence' ? (
  <SequenceDrill bestScore={bestAttempt?.score} onComplete={persistAttempt} />
) : null}
{test.mode === 'priority' ? (
  <PriorityDrill bestScore={bestAttempt?.score} onComplete={persistAttempt} />
) : null}
{test.mode === 'quiz' && test.questions ? (
  <QuizDrill
    questions={test.questions}
    bestScore={bestAttempt?.score}
    onComplete={persistAttempt}
  />
) : null}
```

В клиентских типах также есть режимы:

```ts
export type GameMode =
  | 'reflex'
  | 'sequence'
  | 'priority'
  | 'quiz'
  | 'password'
  | 'phishing'
  | 'privacy'
```

Текущее ограничение: серверная Zod-схема разрешает только `reflex`, `sequence`, `priority`, `quiz`. Если через админку сохранять тесты с режимами `password`, `phishing`, `privacy`, серверная валидация отклонит payload.

Текущий код схемы:

```ts
mode: z.enum(['reflex', 'sequence', 'priority', 'quiz']),
```

Корректная доработка:

```ts
mode: z.enum([
  'reflex',
  'sequence',
  'priority',
  'quiz',
  'password',
  'phishing',
  'privacy',
]),
```

Также нужно расширить PostgreSQL enum `test_mode`. Для миграции:

```sql
alter type test_mode add value if not exists 'password';
alter type test_mode add value if not exists 'phishing';
alter type test_mode add value if not exists 'privacy';
```

### 3.1.10 Реализация страницы материала

Страница материала находится в `src/pages/MaterialDetailPage.tsx`.

Фактический код:

```tsx
const { slug } = useParams()
const { materials } = useContentState()
const { state, markMaterialComplete, toggleBookmark } = usePlatformState()
const material = materials.find((item) => item.slug === slug)

if (!material) {
  return <Navigate to="/materials" replace />
}

const bookmarked = state.bookmarkedMaterials.includes(material.slug)
const completed = state.completedMaterials.includes(material.slug)
```

Действия пользователя:

```tsx
<button
  type="button"
  className="button button--primary"
  onClick={() => markMaterialComplete(material.slug)}
>
  <CheckCircle2 size={16} />
  Отметить как изученный
</button>

<button
  type="button"
  className="button button--ghost"
  onClick={() => toggleBookmark(material.slug)}
>
  {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
  {bookmarked ? 'Убрать из закладок' : 'В закладки'}
</button>
```

Серверные запросы:

```text
POST /api/users/current/materials/:materialSlug/complete
POST /api/users/current/bookmarks/:materialSlug/toggle
```

### 3.1.11 Реализация профиля

Страница профиля находится в `src/pages/ProfilePage.tsx`.

Профиль показывает:

- email аккаунта;
- имя или название команды;
- роль или подразделение;
- количество запусков;
- средний score;
- рекомендации по тестам;
- завершенные материалы;
- историю попыток;
- закладки.

Фактический код расчета рекомендаций:

```tsx
const { tests, materials } = useContentState()
const { currentUserEmail, hasRegisteredAccount, logout, state, updateProfile } = usePlatformState()
const recommended = getRecommendedTests(tests, state.attempts)
const bookmarked = materials.filter((material) => state.bookmarkedMaterials.includes(material.slug))
```

Функция рекомендаций:

```ts
export function getRecommendedTests(allTests: CyberTest[], attempts: StoredAttempt[]) {
  return allTests
    .filter((test) => test.status === 'playable')
    .sort((left, right) => {
      const leftBest = getBestAttempt(left.slug, attempts)?.score ?? 0
      const rightBest = getBestAttempt(right.slug, attempts)?.score ?? 0
      return leftBest - rightBest
    })
    .slice(0, 3)
}
```

Алгоритм: пользователю рекомендуются доступные тесты с минимальным лучшим результатом. Это направляет пользователя к слабым областям.

### 3.1.12 Расчет попыток и уровней

Расчеты находятся в `src/utils/platform.ts`.

Фактический код:

```ts
const tierThresholds: Array<{ name: TierName; min: number }> = [
  { name: 'Легенда', min: 940 },
  { name: 'Алмаз', min: 880 },
  { name: 'Золото', min: 800 },
  { name: 'Серебро', min: 700 },
  { name: 'Бронза', min: 0 },
]

export function getTierByScore(score: number): TierName {
  return tierThresholds.find((tier) => score >= tier.min)?.name ?? 'Бронза'
}

export function createAttempt(test: CyberTest, payload: AttemptPayload): StoredAttempt {
  return {
    id: `${test.slug}-${Date.now()}`,
    testSlug: test.slug,
    score: Math.max(0, Math.round(payload.score)),
    label: payload.label,
    summary: payload.summary,
    tier: getTierByScore(payload.score),
    createdAt: new Date().toISOString(),
  }
}
```

Назначение:

- нормализовать score;
- определить уровень;
- сформировать объект попытки;
- передать результат в серверное API.

Фактическое сохранение происходит на сервере. Клиентская функция нужна для унификации структуры payload.

### 3.1.13 Рейтинг на клиенте

Рейтинг загружается в `useLeaderboardState.tsx`.

Фактический код:

```tsx
export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(seedLeaderboard)

  const refreshLeaderboard = async () => {
    try {
      const next = await apiGet<LeaderboardEntry[]>('/leaderboard/current')
      if (next.length) {
        setLeaderboard(next)
      }
    } catch {
      setLeaderboard(seedLeaderboard)
    }
  }

  useEffect(() => {
    void refreshLeaderboard()
  }, [])
}
```

Если API недоступно, применяется fallback-рейтинг из seed-данных.

### 3.1.14 Локальная административная панель

Административная панель реализована в `src/pages/AdminPage.tsx`.

Функции:

- редактирование тестов;
- редактирование материалов;
- создание теста;
- создание материала;
- удаление теста;
- удаление материала;
- импорт JSON;
- экспорт JSON;
- сброс к базовому набору.

Пример сохранения теста:

```tsx
const saveCurrentTest = async () => {
  try {
    const parsedQuestions = testDraft.mode === 'quiz'
      ? (JSON.parse(questionsText) as QuizQuestion[])
      : undefined

    const nextSlug =
      slugifyValue(testDraft.slug) ||
      slugifyValue(testDraft.title) ||
      `test-${Date.now()}`

    await saveTest(
      {
        ...testDraft,
        slug: nextSlug,
        deck: splitLines(testDraft.deck.join('\n')),
        benefits: splitLines(testDraft.benefits.join('\n')),
        questions: parsedQuestions,
      },
      testSourceSlug ?? undefined,
    )
  } catch {
    setMessage('Не удалось сохранить тест: проверьте JSON блока вопросов.')
  }
}
```

Ограничение: админка локальная, без полноценной ролевой модели. Для production необходимо добавить роли и административную авторизацию.

Пример реализации role-based guard на клиенте:

```tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { state, hasRegisteredAccount } = usePlatformState()

  if (!hasRegisteredAccount) {
    return <Navigate to="/login" replace />
  }

  if (state.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
```

Но в текущем типе `PlatformState.role` хранится пользовательское направление, а не системная роль. Для правильной реализации нужно добавить отдельное поле `appRole`.

Рекомендуемый тип:

```ts
export interface PlatformState {
  accountEmail: string
  learnerName: string
  role: string
  appRole: 'student' | 'instructor' | 'admin'
  completedMaterials: string[]
  bookmarkedMaterials: string[]
  attempts: StoredAttempt[]
}
```

## 3.2 Реализация серверной части веб-приложения

Серверная часть реализована на Express и TypeScript. Сервер предоставляет REST API для frontend, работает с PostgreSQL и выполняет валидацию входных данных.

### 3.2.1 Структура серверной части

```text
server/src/index.ts                         запуск API
server/src/app.ts                           создание Express-приложения
server/src/config/env.ts                    переменные окружения
server/src/db/pool.ts                       подключение к PostgreSQL
server/src/db/schema.sql                    SQL-схема
server/src/db/seed.sql                      начальные данные
server/src/db/seed-demo.ts                  демонстрационное наполнение
server/src/http/asyncHandler.ts             обработка async routes
server/src/http/currentUser.ts              получение текущего пользователя
server/src/http/localAccess.ts              ограничение локального доступа
server/src/http/httpError.ts                HTTP-ошибка
server/src/modules/content                  тесты и материалы
server/src/modules/users                    пользователи и профиль
server/src/modules/leaderboard              рейтинг
```

### 3.2.2 Инициализация Express

Фактический код из `server/src/app.ts`:

```ts
import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { HttpError } from './http/httpError'
import { contentRouter } from './modules/content/content.routes'
import { leaderboardRouter } from './modules/leaderboard/leaderboard.routes'
import { usersRouter } from './modules/users/users.routes'

export function createServer() {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((item) => item.trim()),
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.use('/api/content', contentRouter)
  app.use('/api/leaderboard', leaderboardRouter)
  app.use('/api/users', usersRouter)

  app.use((error, _request, response, _next) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    const status = error instanceof HttpError ? error.status : 500
    response.status(status).json({ message })
  })

  return app
}
```

Назначение:

- подключить CORS;
- включить JSON parser;
- зарегистрировать health-check;
- подключить роутеры;
- централизованно обработать ошибки.

### 3.2.3 Конфигурация окружения

Фактический код из `server/src/config/env.ts`:

```ts
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .default('postgres://cyber_arena:cyber_arena@localhost:5432/cyber_arena'),
  CORS_ORIGIN: z.string().default('http://localhost:4173'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
})

export const env = envSchema.parse(process.env)
```

Задачи:

- загрузить `.env`;
- привести `PORT` к числу;
- задать значения по умолчанию;
- валидировать `DATABASE_SSL`;
- остановить приложение при некорректной конфигурации.

Пример `.env.example`:

```env
VITE_API_URL=http://localhost:4000/api
PORT=4000
DATABASE_URL=postgres://cyber_arena:cyber_arena@localhost:5432/cyber_arena
CORS_ORIGIN=http://localhost:4173
DATABASE_SSL=false
```

### 3.2.4 Подключение к PostgreSQL

Фактический код из `server/src/db/pool.ts`:

```ts
import { Pool } from 'pg'
import { env } from '../config/env'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
})
```

Подключение использует пул соединений. Это требуется для параллельной обработки запросов API.

Для production рекомендуется дополнить настройки:

```ts
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})
```

Также рекомендуется добавить обработчик ошибок пула:

```ts
pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error)
})
```

В текущей реализации такой обработчик не добавлен.

### 3.2.5 SQL-схема

Схема находится в `server/src/db/schema.sql`.

Фрагмент создания enum:

```sql
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('student', 'instructor', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'test_mode') then
    create type test_mode as enum ('reflex', 'sequence', 'priority', 'quiz');
  end if;
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type content_status as enum ('draft', 'playable', 'archived');
  end if;
end $$;
```

Фрагмент таблицы пользователей:

```sql
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  city text,
  primary_track text,
  role app_role not null default 'student',
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Фрагмент таблицы сессий:

```sql
create table if not exists user_sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
```

Фрагмент таблицы тестов:

```sql
create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  headline text not null,
  tag text not null,
  category text not null,
  description text not null,
  difficulty difficulty_level not null default 'base',
  duration_minutes integer not null check (duration_minutes > 0),
  duration_label text not null,
  metric_label text not null,
  accent_color varchar(7) not null,
  mode test_mode not null,
  status content_status not null default 'draft',
  config_json jsonb not null default '{}'::jsonb,
  author_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Схема нормализована. Тесты, вопросы, варианты ответа, попытки и ответы попыток хранятся в разных таблицах.

### 3.2.6 Модуль content

Модуль отвечает за тесты и материалы.

Файлы:

```text
server/src/modules/content/content.routes.ts
server/src/modules/content/content.repository.ts
server/src/modules/content/content.schemas.ts
```

Роуты:

```ts
contentRouter.get('/bundle', ...)
contentRouter.get('/tests', ...)
contentRouter.get('/tests/:slug', ...)
contentRouter.post('/tests', requireLocalAccess, ...)
contentRouter.put('/tests/:slug', requireLocalAccess, ...)
contentRouter.delete('/tests/:slug', requireLocalAccess, ...)
contentRouter.get('/materials', ...)
contentRouter.get('/materials/:slug', ...)
contentRouter.post('/materials', requireLocalAccess, ...)
contentRouter.put('/materials/:slug', requireLocalAccess, ...)
contentRouter.delete('/materials/:slug', requireLocalAccess, ...)
contentRouter.put('/bundle', requireLocalAccess, ...)
```

Публичные операции:

- получение bundle;
- получение списка тестов;
- получение одного теста;
- получение списка материалов;
- получение одного материала.

Административные операции:

- создание;
- обновление;
- удаление;
- массовая замена bundle.

Административные операции требуют локального доступа.

### 3.2.7 Валидация контента

Фактический код из `content.schemas.ts`:

```ts
export const testSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  headline: z.string().min(1),
  tag: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['База', 'Средний', 'Продвинутый']),
  duration: z.string().min(1),
  metric: z.string().min(1),
  accent: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  benefits: z.array(z.string().min(1)),
  deck: z.array(z.string().min(1)),
  mode: z.enum(['reflex', 'sequence', 'priority', 'quiz']),
  status: z.enum(['playable', 'draft']),
  questions: z.array(quizQuestionSchema).optional(),
})
```

Материал:

```ts
export const materialSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  level: z.string().min(1),
  readTime: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)),
  body: z.array(z.string().min(1)),
})
```

Ограничение: схема материала допускает любой `level`. Для согласованности с БД лучше сделать enum:

```ts
level: z.enum(['База', 'Средний', 'Продвинутый']),
```

### 3.2.8 Repository content

Repository преобразует SQL-данные в frontend-формат.

Пример преобразования сложности:

```ts
function difficultyToDb(value: CyberTest['difficulty']) {
  if (value === 'База') return 'base'
  if (value === 'Средний') return 'medium'
  return 'advanced'
}

function difficultyFromDb(value: string): CyberTest['difficulty'] {
  if (value === 'base') return 'База'
  if (value === 'medium') return 'Средний'
  return 'Продвинутый'
}
```

Пример сборки теста:

```ts
function mapTestRow(row: Record<string, unknown>): CyberTest {
  return {
    slug: String(row.slug),
    title: String(row.title),
    headline: String(row.headline),
    tag: String(row.tag),
    category: String(row.category),
    description: String(row.description),
    difficulty: difficultyFromDb(String(row.difficulty)),
    duration: String(row.duration_label),
    metric: String(row.metric_label),
    accent: String(row.accent_color),
    benefits: deckValues((row.benefits as Array<{ value: string }>) ?? []),
    deck: deckValues((row.deck as Array<{ value: string }>) ?? []),
    mode: row.mode as CyberTest['mode'],
    status: statusFromDb(String(row.status)),
    questions: mapQuestions(...),
  }
}
```

SQL-запрос собирает связанные записи через `json_agg`.

Фрагмент:

```sql
select
  t.*,
  coalesce(
    (
      select json_agg(json_build_object('sort_order', sort_order, 'value', value) order by sort_order)
      from test_deck_items
      where test_id = t.id
    ),
    '[]'::json
  ) as deck
from tests t
order by t.created_at desc
```

Такой подход позволяет хранить нормализованные таблицы, но отдавать frontend удобный JSON-объект.

### 3.2.9 Транзакции при изменении контента

Фактический код создания теста:

```ts
export async function createTest(test: CyberTest) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await insertTest(client, test)
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return getTestBySlug(test.slug)
}
```

Причина использования транзакции: тест записывается не в одну таблицу, а в `tests`, `test_deck_items`, `test_benefits`, `test_questions`, `test_question_options`. Если одна вставка завершится ошибкой, вся операция отменяется.

### 3.2.10 Модуль users

Модуль отвечает за пользователей, сессии, профиль, закладки, прогресс и попытки.

Файлы:

```text
server/src/modules/users/users.routes.ts
server/src/modules/users/users.repository.ts
server/src/modules/users/auth.ts
```

Роуты:

```ts
usersRouter.post('/register', ...)
usersRouter.post('/login', ...)
usersRouter.post('/logout', ...)
usersRouter.get('/current/state', ...)
usersRouter.patch('/current/profile', ...)
usersRouter.post('/current/bookmarks/:materialSlug/toggle', ...)
usersRouter.post('/current/materials/:materialSlug/complete', ...)
usersRouter.post('/current/tests/:testSlug/attempts', ...)
```

### 3.2.11 Регистрация

Схема регистрации:

```ts
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  city: z.string().optional(),
  teamId: z.string().uuid().nullable().optional(),
  primaryTrack: z.string().optional(),
})
```

Фактический маршрут:

```ts
usersRouter.post(
  '/register',
  asyncHandler(async (request, response) => {
    const payload = registerSchema.parse(request.body)
    const existing = await getUserByEmail(payload.email)

    if (existing) {
      response.status(409).json({ message: 'Пользователь с таким email уже существует.' })
      return
    }

    const user = await createUser({
      email: payload.email,
      passwordHash: hashPassword(payload.password),
      displayName: payload.displayName,
      city: payload.city,
      teamId: payload.teamId,
      primaryTrack: payload.primaryTrack,
    })

    const sessionToken = await createUserSession(String(user.id))
    response.status(201).json({
      sessionToken,
      state: await getUserStateById(String(user.id)),
    })
  }),
)
```

Алгоритм:

1. Валидация body.
2. Проверка уникальности email.
3. Хеширование пароля.
4. Создание пользователя.
5. Создание сессии.
6. Возврат token и состояния пользователя.

### 3.2.12 Вход

Фактический код:

```ts
usersRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body)
    const user = await getUserByEmail(payload.email)

    if (!user || !verifyPassword(payload.password, String(user.password_hash))) {
      throw new HttpError(401, 'Неверный email или пароль.')
    }

    const sessionToken = await createUserSession(String(user.id))
    response.json({
      sessionToken,
      state: await getUserStateById(String(user.id)),
    })
  }),
)
```

Логика:

- email валидируется;
- пароль должен быть не меньше 8 символов;
- пользователь ищется по email;
- пароль проверяется через `verifyPassword`;
- при ошибке возвращается 401;
- при успехе создается новая сессия.

### 3.2.13 Получение состояния пользователя

Фактический код `getUserStateById`:

```ts
export async function getUserStateById(userId: string): Promise<PlatformState> {
  const user = await requireCurrentUserById(userId)

  const [bookmarks, progress, attempts] = await Promise.all([
    pool.query(
      `
        select m.slug
        from material_bookmarks mb
        join materials m on m.id = mb.material_id
        where mb.user_id = $1
        order by mb.created_at desc
      `,
      [user.id],
    ),
    pool.query(
      `
        select m.slug
        from material_progress mp
        join materials m on m.id = mp.material_id
        where mp.user_id = $1 and mp.status = 'completed'
        order by mp.completed_at desc nulls last
      `,
      [user.id],
    ),
    pool.query(
      `
        select ta.id, t.slug as test_slug, ta.score, ta.label, ta.summary, ta.tier_name, ta.completed_at
        from test_attempts ta
        join tests t on t.id = ta.test_id
        where ta.user_id = $1
        order by ta.completed_at desc
        limit 30
      `,
      [user.id],
    ),
  ])

  return {
    accountEmail: String(user.email),
    learnerName: String(user.display_name ?? 'Ваш профиль'),
    role: String(user.primary_track ?? 'Cybersecurity Team'),
    bookmarkedMaterials: bookmarks.rows.map((row) => String(row.slug)),
    completedMaterials: progress.rows.map((row) => String(row.slug)),
    attempts: mapAttempts(attempts.rows),
  }
}
```

Здесь используется `Promise.all`, потому что закладки, прогресс и попытки можно загрузить параллельно.

### 3.2.14 Сохранение попытки

Фактический код:

```ts
function tierFromScore(score: number) {
  if (score >= 940) return 'Легенда'
  if (score >= 880) return 'Алмаз'
  if (score >= 800) return 'Золото'
  if (score >= 700) return 'Серебро'
  return 'Бронза'
}

export async function createAttemptByUserId(
  userId: string,
  testSlug: string,
  payload: { score: number; label: string; summary: string },
) {
  const user = await requireCurrentUserById(userId)
  const test = await pool.query('select id from tests where slug = $1 limit 1', [testSlug])

  if (!test.rows[0]) {
    throw new Error('Тест для сохранения попытки не найден.')
  }

  await pool.query(
    `
      insert into test_attempts (test_id, user_id, score, label, summary, tier_name, meta_json)
      values ($1, $2, $3, $4, $5, $6, '{}'::jsonb)
    `,
    [test.rows[0].id, user.id, payload.score, payload.label, payload.summary, tierFromScore(payload.score)],
  )

  return getUserStateById(userId)
}
```

Ограничение: ответы пользователя на отдельные вопросы сейчас не сохраняются в `attempt_answers`. Таблица для этого уже есть. Реализация могла бы выглядеть так:

```ts
const attemptWithAnswersSchema = z.object({
  score: z.number().int().min(0),
  label: z.string().min(1),
  summary: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionId: z.string().uuid().nullable(),
      isCorrect: z.boolean(),
    }),
  ),
})
```

```ts
await client.query(
  `
    insert into test_attempts (test_id, user_id, score, label, summary, tier_name, meta_json)
    values ($1, $2, $3, $4, $5, $6, '{}'::jsonb)
    returning id
  `,
  [testId, userId, score, label, summary, tierFromScore(score)],
)

for (const answer of payload.answers) {
  await client.query(
    `
      insert into attempt_answers (
        attempt_id,
        question_id,
        selected_option_id,
        is_correct
      )
      values ($1, $2, $3, $4)
    `,
    [attemptId, answer.questionId, answer.selectedOptionId, answer.isCorrect],
  )
}
```

### 3.2.15 Модуль leaderboard

Маршрут:

```ts
leaderboardRouter.get(
  '/current',
  asyncHandler(async (_request, response) => {
    response.json(await listCurrentLeaderboard())
  }),
)
```

Repository:

```ts
export async function listCurrentLeaderboard() {
  const result = await pool.query(
    `
      select
        row_number() over (order by best_score desc, display_name asc) as rank,
        display_name as name,
        coalesce(team_name, 'Без команды') as squad,
        coalesce(city, 'Не указан') as city,
        coalesce(primary_track, 'Custom') as track,
        tier_name as tier,
        best_score as score
      from leaderboard_current
      order by best_score desc, display_name asc
      limit 100
    `,
  )

  return result.rows
}
```

Рейтинг строится на стороне БД через view `leaderboard_current`.

Фрагмент SQL:

```sql
create or replace view leaderboard_current as
with best_attempts as (
  select
    ta.user_id,
    max(ta.score) as best_score
  from test_attempts ta
  group by ta.user_id
)
select
  u.id as user_id,
  u.display_name,
  u.city,
  u.primary_track,
  coalesce(t.name, 'Без команды') as team_name,
  coalesce(ba.best_score, 0) as best_score,
  case
    when coalesce(ba.best_score, 0) >= 940 then 'Легенда'
    when coalesce(ba.best_score, 0) >= 880 then 'Алмаз'
    when coalesce(ba.best_score, 0) >= 800 then 'Золото'
    when coalesce(ba.best_score, 0) >= 700 then 'Серебро'
    else 'Бронза'
  end as tier_name
from users u
left join teams t on t.id = u.team_id
left join best_attempts ba on ba.user_id = u.id;
```

Преимущество: frontend и backend не вычисляют рейтинг вручную. Логика лучшего результата централизована в БД.

## 3.3 Тестирование

В текущем проекте автоматизированные unit-, integration- и e2e-тесты не настроены. Фактически выполнены две проверки:

```bash
npm run lint
npm run build
```

Результат:

- `npm run lint` завершился без ошибок;
- `npm run build` завершился успешно;
- Vite собрал production-версию;
- предупреждение: JS chunk больше 500 kB.

Фактический результат сборки:

```text
dist/index.html                   0.46 kB
dist/assets/index-Bk2L8SVv.css   53.61 kB
dist/assets/index-Do24rATW.js   543.43 kB
```

Предупреждение Vite не блокирует сборку. Для дальнейшей оптимизации следует добавить code splitting.

### 3.3.1 Статическая проверка

Команда:

```bash
npm run lint
```

Назначение:

- проверить синтаксис;
- проверить правила ESLint;
- проверить правила React hooks;
- выявить часть ошибок TypeScript/React до запуска приложения.

### 3.3.2 Проверка сборки

Команда:

```bash
npm run build
```

Назначение:

- выполнить TypeScript build;
- проверить корректность импортов;
- собрать production frontend;
- проверить, что приложение может быть размещено как статический build.

### 3.3.3 Что отсутствует

Не настроены:

- unit-тесты;
- integration-тесты API;
- e2e-тесты браузерных сценариев;
- тестовая база данных;
- coverage report;
- CI pipeline.

### 3.3.4 Как реализовать unit-тесты

Рекомендуемый инструмент: Vitest.

Установка:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Пример конфигурации:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

Пример setup:

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
```

Пример теста для `getTierByScore`:

```ts
import { describe, expect, it } from 'vitest'
import { getTierByScore } from '../utils/platform'

describe('getTierByScore', () => {
  it('returns Bronze for low score', () => {
    expect(getTierByScore(100)).toBe('Бронза')
  })

  it('returns Legend for score from 940', () => {
    expect(getTierByScore(940)).toBe('Легенда')
  })
})
```

### 3.3.5 Как реализовать integration-тесты API

Рекомендуемый инструмент: Vitest + Supertest.

Установка:

```bash
npm install -D supertest @types/supertest
```

Пример health-check теста:

```ts
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createServer } from '../server/src/app'

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const app = createServer()

    await request(app)
      .get('/api/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({ status: 'ok' })
      })
  })
})
```

Для тестов, использующих БД, нужен отдельный `DATABASE_URL_TEST`.

Пример:

```env
DATABASE_URL_TEST=postgres://cyber_arena:cyber_arena@localhost:5433/cyber_arena_test
```

### 3.3.6 Как реализовать e2e-тесты

Рекомендуемый инструмент: Playwright.

Установка:

```bash
npm install -D @playwright/test
npx playwright install
```

Пример теста:

```ts
import { expect, test } from '@playwright/test'

test('user can open tests catalog', async ({ page }) => {
  await page.goto('http://localhost:4173/#/tests')

  await expect(page.getByRole('heading', { name: /тренировки/i })).toBeVisible()
  await expect(page.locator('a[href^="#/tests/"]').first()).toBeVisible()
})
```

Пример теста регистрации:

```ts
test('user can register', async ({ page }) => {
  await page.goto('http://localhost:4173/#/register')

  await page.getByLabel(/email/i).fill(`user-${Date.now()}@example.com`)
  await page.getByLabel(/пароль/i).fill('password123')
  await page.getByLabel(/имя/i).fill('Test User')
  await page.getByRole('button', { name: /зарегистр/i }).click()

  await expect(page).toHaveURL(/profile|\/#\//)
})
```

Точные селекторы нужно согласовать с текущей версткой форм.

## 3.3. Обеспечение информационной безопасности

В проекте реализованы базовые меры безопасности. Часть мер реализована фактически, часть рекомендуется для дальнейшего внедрения.

### 3.3.1 Хеширование паролей

Фактический код из `server/src/modules/users/auth.ts`:

```ts
import crypto from 'node:crypto'

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex')

  return `scrypt:${salt}:${hash}`
}
```

Проверка:

```ts
export function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(':')

  if (parts.length === 3 && parts[0] === 'scrypt') {
    const [, salt, hash] = parts
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
    const stored = Buffer.from(hash, 'hex')

    if (stored.length !== derived.length) {
      return false
    }

    return crypto.timingSafeEqual(stored, derived)
  }

  return false
}
```

Используется:

- случайная соль;
- scrypt;
- сравнение через `timingSafeEqual`.

### 3.3.2 Сессионная модель

Токен сессии:

```ts
export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}
```

Создание сессии:

```ts
export async function createUserSession(userId: string) {
  const token = createSessionToken()

  await pool.query(
    `
      insert into user_sessions (token, user_id, expires_at)
      values ($1, $2, now() + interval '30 days')
    `,
    [token, userId],
  )

  return token
}
```

Проверка текущего пользователя:

```ts
export async function requireAuthenticatedUser(request: Request) {
  const sessionToken = resolveCurrentSessionToken(request)

  if (!sessionToken) {
    throw new HttpError(401, 'Требуется вход в аккаунт.')
  }

  const user = await getUserBySessionToken(sessionToken)

  if (!user) {
    throw new HttpError(401, 'Сессия не найдена или уже завершена.')
  }

  return user
}
```

Проверка сессии в SQL:

```sql
select
  u.id,
  u.email,
  u.password_hash,
  u.display_name,
  u.city,
  u.primary_track,
  u.role,
  u.team_id
from user_sessions s
join users u on u.id = s.user_id
where s.token = $1
  and s.revoked_at is null
  and s.expires_at > now()
limit 1
```

### 3.3.3 Ограничение локальной админки

Клиентская проверка:

```ts
const localHostnames = new Set(['localhost', '127.0.0.1', '::1'])

export function isLocalAdminHost(hostname?: string) {
  const currentHostname =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')

  if (!currentHostname) {
    return false
  }

  return localHostnames.has(currentHostname) || isPrivateIpv4(currentHostname)
}
```

Серверная проверка:

```ts
export function requireLocalAccess(request: Request, response: Response, next: NextFunction) {
  if (hasLocalOrigin(request) || (!request.header('origin') && hasLocalHostHeader(request))) {
    next()
    return
  }

  response.status(403).json({
    message: 'Админский доступ разрешён только с локального адреса.',
  })
}
```

Защищенные операции контента используют middleware:

```ts
contentRouter.post('/tests', requireLocalAccess, ...)
contentRouter.put('/tests/:slug', requireLocalAccess, ...)
contentRouter.delete('/tests/:slug', requireLocalAccess, ...)
contentRouter.put('/bundle', requireLocalAccess, ...)
```

### 3.3.4 CORS

Фактическая настройка:

```ts
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((item) => item.trim()),
    credentials: true,
  }),
)
```

Значение по умолчанию:

```env
CORS_ORIGIN=http://localhost:4173
```

Для production нужно указать реальный домен frontend.

### 3.3.5 Валидация входных данных

Пример проверки регистрации:

```ts
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  city: z.string().optional(),
  teamId: z.string().uuid().nullable().optional(),
  primaryTrack: z.string().optional(),
})
```

Пример проверки попытки:

```ts
const attemptSchema = z.object({
  score: z.number().int().min(0),
  label: z.string().min(1),
  summary: z.string().min(1),
})
```

Валидация выполняется до обращения к repository.

### 3.3.6 Недостающие меры безопасности и реализация

Не реализован rate limiting. Рекомендуемая реализация:

```bash
npm install express-rate-limit
```

```ts
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

usersRouter.post('/login', authLimiter, asyncHandler(async (request, response) => {
  // login logic
}))
```

Не реализованы security headers. Рекомендуемая реализация:

```bash
npm install helmet
```

```ts
import helmet from 'helmet'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", env.CORS_ORIGIN],
      },
    },
  }),
)
```

Не реализован аудит действий. Рекомендуемая таблица:

```sql
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);
```

Пример записи аудита:

```ts
await pool.query(
  `
    insert into audit_log (user_id, action, entity_type, entity_id, ip, user_agent)
    values ($1, $2, $3, $4, $5, $6)
  `,
  [userId, 'content.update', 'test', testSlug, request.ip, request.header('user-agent')],
)
```

Не реализована полноценная ролевая модель для админки. Рекомендуемый middleware:

```ts
export function requireRole(...roles: Array<'student' | 'instructor' | 'admin'>) {
  return asyncHandler(async (request, _response, next) => {
    const user = await requireAuthenticatedUser(request)

    if (!roles.includes(user.role)) {
      throw new HttpError(403, 'Недостаточно прав.')
    }

    next()
  })
}
```

Использование:

```ts
contentRouter.post('/tests', requireRole('admin', 'instructor'), asyncHandler(...))
```

## 3.4. Тестирование веб приложения

Раздел фиксирует полный набор проверок, который должен быть выполнен перед передачей приложения.

### 3.4.1 Проверка запуска

Порядок:

```bash
npm install
npm run db:up
npm run dev:api
npm run dev
```

Проверить:

- frontend открывается на `http://localhost:4173`;
- API отвечает на `http://localhost:4000/api/health`;
- PostgreSQL доступен на `localhost:5432`;
- приложение загружает контент из API;
- при выключенном API frontend использует fallback-данные.

### 3.4.2 Проверка клиентских маршрутов

Маршруты:

```text
/#/
/#/tests
/#/tests/:slug
/#/leaderboard
/#/materials
/#/materials/:slug
/#/login
/#/register
/#/profile
/#/admin
```

Ожидаемый результат:

- известные маршруты открываются;
- неизвестный маршрут ведет на главную;
- `/admin` открывается только локально.

### 3.4.3 Проверка регистрации

Шаги:

1. Открыть `/#/register`.
2. Ввести новый email.
3. Ввести пароль длиной от 8 символов.
4. Ввести имя.
5. Отправить форму.
6. Проверить создание записи в `users`.
7. Проверить создание записи в `user_sessions`.
8. Проверить сохранение session token на клиенте.

SQL-проверка:

```sql
select id, email, display_name, city, primary_track, role, created_at
from users
order by created_at desc
limit 5;
```

```sql
select user_id, created_at, expires_at, revoked_at
from user_sessions
order by created_at desc
limit 5;
```

### 3.4.4 Проверка входа

Шаги:

1. Открыть `/#/login`.
2. Ввести email существующего пользователя.
3. Ввести правильный пароль.
4. Проверить вход.
5. Ввести неправильный пароль.
6. Проверить ответ `401`.

Ожидаемая ошибка:

```json
{
  "message": "Неверный email или пароль."
}
```

### 3.4.5 Проверка тестов

Шаги:

1. Открыть каталог тестов.
2. Проверить отображение карточек.
3. Открыть тест по slug.
4. Пройти тест.
5. Проверить сохранение попытки.
6. Проверить обновление профиля.
7. Проверить обновление рейтинга.

SQL-проверка:

```sql
select
  ta.id,
  u.email,
  t.slug,
  ta.score,
  ta.tier_name,
  ta.completed_at
from test_attempts ta
join users u on u.id = ta.user_id
join tests t on t.id = ta.test_id
order by ta.completed_at desc
limit 10;
```

### 3.4.6 Проверка материалов

Шаги:

1. Открыть каталог материалов.
2. Открыть материал.
3. Добавить в закладки.
4. Отметить как изученный.
5. Проверить профиль.

SQL-проверка закладок:

```sql
select u.email, m.slug, mb.created_at
from material_bookmarks mb
join users u on u.id = mb.user_id
join materials m on m.id = mb.material_id
order by mb.created_at desc
limit 10;
```

SQL-проверка прогресса:

```sql
select u.email, m.slug, mp.status, mp.completed_at
from material_progress mp
join users u on u.id = mp.user_id
join materials m on m.id = mp.material_id
order by mp.completed_at desc
limit 10;
```

### 3.4.7 Проверка админки

Шаги:

1. Открыть `http://localhost:4173/#/admin`.
2. Создать тест.
3. Проверить появление теста в каталоге.
4. Изменить тест.
5. Удалить тест.
6. Создать материал.
7. Проверить импорт JSON.
8. Проверить экспорт JSON.
9. Выполнить внешний запрос к административному API с нелокального origin.
10. Проверить ответ `403`.

Пример curl для проверки запрета:

```bash
curl -i \
  -H "Origin: https://example.com" \
  -H "Content-Type: application/json" \
  -X POST \
  http://localhost:4000/api/content/tests \
  -d '{"slug":"x"}'
```

Ожидаемый ответ:

```json
{
  "message": "Админский доступ разрешён только с локального адреса."
}
```

### 3.4.8 Проверка рейтинга

Запрос:

```bash
curl http://localhost:4000/api/leaderboard/current
```

Ожидаемая структура элемента:

```json
{
  "rank": 1,
  "name": "User",
  "squad": "Team",
  "city": "City",
  "track": "Custom",
  "tier": "Золото",
  "score": 820
}
```

SQL-проверка:

```sql
select *
from leaderboard_current
order by best_score desc
limit 10;
```

### 3.4.9 Проверка production-сборки

Команда:

```bash
npm run build
```

Проверить:

- создан каталог `dist`;
- `dist/index.html` существует;
- JS и CSS bundle существуют;
- приложение открывается через preview.

Команда preview:

```bash
npm run preview
```

### 3.4.10 Критерии приемки

Приложение можно считать готовым к демонстрации, если:

- frontend запускается;
- API запускается;
- PostgreSQL запускается;
- регистрация работает;
- вход работает;
- тесты открываются;
- попытки сохраняются;
- материалы открываются;
- закладки сохраняются;
- прогресс сохраняется;
- рейтинг обновляется;
- админка доступна локально;
- внешние мутации контента заблокированы;
- `npm run lint` проходит;
- `npm run build` проходит.

## 3.5. Развертывание и запуск веб приложения

### 3.5.1 Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить PostgreSQL:

```bash
npm run db:up
```

Запустить API:

```bash
npm run dev:api
```

Запустить frontend:

```bash
npm run dev
```

Адреса:

```text
Frontend:   http://localhost:4173
API:        http://localhost:4000/api
PostgreSQL: localhost:5432
```

### 3.5.2 Docker Compose

Фактический `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: cyber-arena-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: cyber_arena
      POSTGRES_USER: cyber_arena
      POSTGRES_PASSWORD: cyber_arena
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/src/db/schema.sql:/docker-entrypoint-initdb.d/001-schema.sql:ro
      - ./server/src/db/seed.sql:/docker-entrypoint-initdb.d/002-seed.sql:ro

volumes:
  postgres_data:
```

При первом запуске контейнера:

- создается база;
- применяется схема;
- загружаются seed-данные.

### 3.5.3 Команды package.json

Фактические scripts:

```json
{
  "dev": "vite",
  "dev:api": "tsx watch server/src/index.ts",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "db:up": "docker compose up -d postgres",
  "db:down": "docker compose down",
  "db:logs": "docker compose logs -f postgres",
  "db:seed:demo": "tsx server/src/db/seed-demo.ts"
}
```

Назначение:

- `dev` - frontend development server;
- `dev:api` - backend development server;
- `build` - production-сборка frontend;
- `lint` - статическая проверка;
- `preview` - preview production build;
- `db:up` - запуск PostgreSQL;
- `db:down` - остановка PostgreSQL;
- `db:logs` - логи PostgreSQL;
- `db:seed:demo` - повторное наполнение демонстрационными данными.

### 3.5.4 Production-развертывание

Рекомендуемая схема:

```text
Browser
  -> Nginx / Static Hosting
  -> dist frontend
  -> API backend
  -> PostgreSQL
```

Шаги:

1. Создать production `.env`.
2. Установить зависимости.
3. Собрать frontend.
4. Развернуть backend как Node.js service.
5. Развернуть PostgreSQL.
6. Применить SQL-схему.
7. Настроить домен.
8. Настроить HTTPS.
9. Настроить CORS.
10. Настроить backup БД.

Сборка frontend:

```bash
npm run build
```

Старт backend в production можно реализовать отдельной командой:

```json
{
  "start:api": "node dist-server/index.js"
}
```

Сейчас отдельная production-сборка backend не настроена. Для нее нужно добавить `tsup`, `esbuild` или компиляцию через `tsc`.

Пример через `tsup`:

```bash
npm install -D tsup
```

```json
{
  "build:api": "tsup server/src/index.ts --platform=node --format=esm --out-dir dist-server",
  "start:api": "node dist-server/index.js"
}
```

### 3.5.5 Nginx-конфигурация

Если frontend размещается через Nginx:

```nginx
server {
  listen 80;
  server_name cyber-arena.example.com;

  root /var/www/cyber-arena/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Так как используется `HashRouter`, fallback на `index.html` нужен меньше, но он не мешает.

### 3.5.6 Backup PostgreSQL

Создать backup:

```bash
pg_dump "$DATABASE_URL" > cyber_arena_backup.sql
```

Восстановить:

```bash
psql "$DATABASE_URL" < cyber_arena_backup.sql
```

Для Docker:

```bash
docker exec cyber-arena-postgres pg_dump -U cyber_arena cyber_arena > backup.sql
```

### 3.5.7 Обновление приложения

Порядок обновления:

1. Получить новую версию кода.
2. Установить зависимости.
3. Проверить `.env`.
4. Применить миграции БД.
5. Выполнить `npm run lint`.
6. Выполнить `npm run build`.
7. Перезапустить API.
8. Обновить frontend build.
9. Проверить health-check.
10. Проверить основные пользовательские сценарии.

## 3.6. Недостающие реализации и план доработок

В задании название раздела 3.6 не указано. Для полноты раздел используется как список недостающих реализаций и способ их внедрения.

### 3.6.1 Миграции базы данных

Сейчас схема задается через `schema.sql`. Для production лучше использовать миграции.

Рекомендуемый инструмент: node-pg-migrate.

Установка:

```bash
npm install -D node-pg-migrate
```

Пример миграции:

```ts
import type { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('users', {
    last_login_at: { type: 'timestamptz' },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('users', ['last_login_at'])
}
```

Команды:

```json
{
  "migrate:up": "node-pg-migrate up",
  "migrate:down": "node-pg-migrate down"
}
```

### 3.6.2 OpenAPI-документация

Сейчас REST API не описан в OpenAPI. Рекомендуемая структура:

```yaml
openapi: 3.0.3
info:
  title: Cyber Arena API
  version: 1.0.0
paths:
  /api/health:
    get:
      summary: Health check
      responses:
        '200':
          description: API is available
  /api/users/login:
    post:
      summary: Login user
      requestBody:
        required: true
      responses:
        '200':
          description: Auth session
        '401':
          description: Invalid credentials
```

### 3.6.3 Code splitting

Сейчас Vite предупреждает о JS chunk больше 500 kB. Можно вынести страницы в lazy imports.

Пример:

```tsx
import { lazy, Suspense } from 'react'

const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Загрузка...</div>}>{children}</Suspense>
}
```

Использование:

```tsx
<Route
  path="/admin"
  element={
    <LazyRoute>
      <AdminPage />
    </LazyRoute>
  }
/>
```

### 3.6.4 Ролевая модель

Сейчас админка локальная. Для production нужна роль `admin`.

Изменение состояния:

```ts
export interface PlatformState {
  accountEmail: string
  learnerName: string
  role: string
  appRole: 'student' | 'instructor' | 'admin'
  completedMaterials: string[]
  bookmarkedMaterials: string[]
  attempts: StoredAttempt[]
}
```

Backend должен возвращать `appRole`:

```ts
return {
  accountEmail: String(user.email),
  learnerName: String(user.display_name ?? 'Ваш профиль'),
  role: String(user.primary_track ?? 'Cybersecurity Team'),
  appRole: user.role,
  bookmarkedMaterials: bookmarks.rows.map((row) => String(row.slug)),
  completedMaterials: progress.rows.map((row) => String(row.slug)),
  attempts: mapAttempts(attempts.rows),
}
```

### 3.6.5 Подробная аналитика тестов

Таблица `attempt_answers` есть, но не используется основным сценарием сохранения. Для аналитики нужно сохранять ответы.

Результат:

- можно смотреть ошибки пользователя;
- можно строить статистику по вопросам;
- можно определять слабые темы;
- можно выдавать рекомендации.

Пример SQL для анализа ошибок:

```sql
select
  q.prompt,
  count(*) filter (where aa.is_correct = false) as wrong_count,
  count(*) as total_count
from attempt_answers aa
join test_questions q on q.id = aa.question_id
group by q.prompt
order by wrong_count desc;
```

### 3.6.6 CI pipeline

Сейчас CI не настроен. Пример GitHub Actions:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

## 3.7 Документация для развертывания использования и дальнейших обновлений, что из чего состоит для передачи руководству и дев команде

### 3.7.1 Документация для руководства

Руководству нужно передать краткое описание состава системы.

Состав:

```text
Cyber Arena
  Frontend
    React SPA
    Страницы
    Тренажеры
    Профиль
    Рейтинг
    Админка

  Backend
    Express API
    Пользователи
    Контент
    Рейтинг
    Сессии

  Database
    PostgreSQL
    Пользователи
    Материалы
    Тесты
    Попытки
    Прогресс
    Закладки
```

Основные функции:

- регистрация и вход;
- прохождение тестов;
- сохранение результатов;
- чтение материалов;
- закладки;
- отметка завершенных материалов;
- рейтинг;
- управление контентом через локальную админку.

Ограничения:

- автоматические тесты не настроены;
- production-авторизация администратора не реализована;
- backend production build не выделен отдельной командой;
- миграции БД не настроены;
- session token хранится в localStorage.

### 3.7.2 Документация для dev-команды

Ключевые файлы:

```text
README.md                                      быстрый старт
PROJECT_DOCUMENTATION.md                       изменения и админка
docs/ARCHITECTURE.md                           архитектура
docs/POSTGRESQL_DATA_MODEL.md                  модель данных
docs/SITE_PRODUCT_DOCUMENTATION.md             продуктовая документация
docs/CHAPTER_3_FULL_TECHNICAL_DESCRIPTION.md   текущий документ
server/src/db/schema.sql                       SQL-схема
docker-compose.yml                             PostgreSQL
package.json                                   команды проекта
.env.example                                   переменные окружения
```

Клиент:

```text
src/app/AppRouter.tsx              маршруты
src/app/AppProviders.tsx           провайдеры
src/hooks/useContentState.tsx      контент
src/hooks/usePlatformState.tsx     пользователь
src/hooks/useLeaderboardState.tsx  рейтинг
src/utils/api.ts                   HTTP-клиент
src/pages/AdminPage.tsx            админка
src/pages/TestDetailPage.tsx       тесты
src/pages/MaterialDetailPage.tsx   материалы
src/pages/ProfilePage.tsx          профиль
```

Сервер:

```text
server/src/app.ts                                   Express app
server/src/config/env.ts                            env
server/src/db/pool.ts                               PostgreSQL pool
server/src/http/currentUser.ts                      auth middleware
server/src/http/localAccess.ts                      local admin access
server/src/modules/content/content.routes.ts        content routes
server/src/modules/content/content.repository.ts    content SQL
server/src/modules/content/content.schemas.ts       content validation
server/src/modules/users/users.routes.ts            user routes
server/src/modules/users/users.repository.ts        user SQL
server/src/modules/users/auth.ts                    password/session helpers
server/src/modules/leaderboard/leaderboard.routes.ts
server/src/modules/leaderboard/leaderboard.repository.ts
```

### 3.7.3 Инструкция запуска для разработчика

```bash
npm install
cp .env.example .env
npm run db:up
npm run dev:api
npm run dev
```

Проверка:

```bash
curl http://localhost:4000/api/health
```

Ожидаемый ответ:

```json
{
  "status": "ok"
}
```

### 3.7.4 Инструкция обновления контента

Через админку:

1. Запустить frontend и API локально.
2. Открыть `http://localhost:4173/#/admin`.
3. Выбрать `Тесты` или `Материалы`.
4. Создать или изменить запись.
5. Сохранить.
6. Проверить публичную страницу.

Через JSON:

1. Открыть вкладку `JSON / импорт`.
2. Вставить объект:

```json
{
  "tests": [],
  "materials": []
}
```

3. Выполнить импорт.
4. Проверить каталог тестов и материалов.

### 3.7.5 Инструкция обновления кода

Порядок:

```bash
git pull
npm install
npm run lint
npm run build
npm run db:seed:demo
```

`db:seed:demo` выполнять только если нужно перезаполнить демонстрационные данные.

### 3.7.6 Инструкция обновления базы

Сейчас нет системы миграций. При изменении `schema.sql` нужно:

- создать backup;
- применить SQL вручную;
- проверить совместимость seed-данных;
- проверить API;
- проверить frontend.

Backup:

```bash
docker exec cyber-arena-postgres pg_dump -U cyber_arena cyber_arena > backup.sql
```

Восстановление:

```bash
cat backup.sql | docker exec -i cyber-arena-postgres psql -U cyber_arena cyber_arena
```

### 3.7.7 Передача проекта

Минимальный комплект передачи:

```text
1. Исходный код проекта.
2. README.md.
3. .env.example.
4. docker-compose.yml.
5. server/src/db/schema.sql.
6. server/src/db/seed.sql.
7. docs/ARCHITECTURE.md.
8. docs/POSTGRESQL_DATA_MODEL.md.
9. docs/SITE_PRODUCT_DOCUMENTATION.md.
10. docs/CHAPTER_3_FULL_TECHNICAL_DESCRIPTION.md.
```

Что должна знать dev-команда:

- frontend получает API URL из `VITE_API_URL`;
- backend получает БД из `DATABASE_URL`;
- CORS задается через `CORS_ORIGIN`;
- PostgreSQL поднимается через Docker Compose;
- seed-данные применяются при первом создании volume;
- повторное демо-наполнение выполняется через `npm run db:seed:demo`;
- административные API доступны только с локального origin/host;
- session token хранится на клиенте в localStorage;
- текущая схема БД не использует миграции;
- для production нужно усилить авторизацию, тестирование и deployment pipeline.

### 3.7.8 Итоговая техническая карта

```text
Пользователь
  -> React frontend
    -> apiGet/apiSend
      -> Express routes
        -> Zod validation
        -> repository
          -> PostgreSQL
            -> normalized tables
            -> leaderboard_current view
```

Основной поток прохождения теста:

```text
TestDetailPage
  -> game component
    -> onComplete
      -> createAttempt
        -> saveAttempt
          -> POST /api/users/current/tests/:testSlug/attempts
            -> requireAuthenticatedUser
              -> createAttemptByUserId
                -> insert into test_attempts
                  -> getUserStateById
                    -> return PlatformState
```

Основной поток чтения материала:

```text
MaterialDetailPage
  -> toggleBookmark
    -> POST /api/users/current/bookmarks/:materialSlug/toggle
      -> material_bookmarks

MaterialDetailPage
  -> markMaterialComplete
    -> POST /api/users/current/materials/:materialSlug/complete
      -> material_progress
```

Основной поток рейтинга:

```text
LeaderboardPage
  -> useLeaderboardState
    -> GET /api/leaderboard/current
      -> leaderboard.repository
        -> leaderboard_current SQL view
          -> users + teams + test_attempts
```
