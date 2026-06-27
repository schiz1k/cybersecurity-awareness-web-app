import {
  Award,
  BadgeCheck,
  BookCheck,
  BookMarked,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  Crown,
  Flame,
  Gem,
  GraduationCap,
  KeyRound,
  Medal,
  Rocket,
  ShieldCheck,
  ShieldHalf,
  Sparkles,
  Star,
  Sun,
  Target,
  Type,
  Trophy,
  Zap,
} from 'lucide-react'
import type { ElementType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useContentState } from '../hooks/useContentState'
import { usePlatformState } from '../hooks/usePlatformState'
import { useTheme } from '../hooks/useTheme'
import { formatLongDate, getAverageScore, getRecommendedTests } from '../utils/platform'
import type { MaterialItem, StoredAttempt } from '../types'

const VISIT_STREAK_KEY = 'cyber-arena-visit-streak'

interface VisitStreakState {
  lastVisitDate: string
  streak: number
}

interface AchievementView {
  title: string
  description: string
  icon: ElementType
  difficulty: 'База' | 'Средний' | 'Продвинутый'
  points: number
  current: number
  target: number
}

interface TaskView {
  title: string
  description: string
  icon: ElementType
  points: number
  current: number
  target: number
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function previousDayKey(value: string) {
  const date = new Date(value)
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

function readVisitStreak(): VisitStreakState {
  if (typeof window === 'undefined') {
    return { lastVisitDate: todayKey(), streak: 1 }
  }

  try {
    const raw = window.localStorage.getItem(VISIT_STREAK_KEY)
    return raw ? (JSON.parse(raw) as VisitStreakState) : { lastVisitDate: '', streak: 0 }
  } catch {
    return { lastVisitDate: '', streak: 0 }
  }
}

function updateVisitStreak(): VisitStreakState {
  const today = todayKey()
  const stored = readVisitStreak()

  if (stored.lastVisitDate === today) {
    return stored.streak ? stored : { lastVisitDate: today, streak: 1 }
  }

  const next =
    stored.lastVisitDate === previousDayKey(today)
      ? { lastVisitDate: today, streak: stored.streak + 1 }
      : { lastVisitDate: today, streak: 1 }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(VISIT_STREAK_KEY, JSON.stringify(next))
  }

  return next
}

function clampProgress(current: number, target: number) {
  return Math.min(100, Math.round((Math.min(current, target) / target) * 100))
}

function countCompletedByCategory(materials: MaterialItem[], completedSlugs: string[], category: string) {
  return materials.filter(
    (material) => material.category === category && completedSlugs.includes(material.slug),
  ).length
}

function countAttemptsByCategory(
  attempts: StoredAttempt[],
  tests: Array<{ slug: string; category: string }>,
  category: string,
) {
  const slugs = new Set(tests.filter((test) => test.category === category).map((test) => test.slug))
  return attempts.filter((attempt) => slugs.has(attempt.testSlug)).length
}

function buildAchievements({
  attempts,
  bookmarkedMaterials,
  completedMaterials,
  materials,
  tests,
  visitStreak,
}: {
  attempts: StoredAttempt[]
  bookmarkedMaterials: string[]
  completedMaterials: string[]
  materials: MaterialItem[]
  tests: Array<{ slug: string; category: string }>
  visitStreak: number
}): AchievementView[] {
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0)
  const averageScore = getAverageScore(attempts)
  const uniqueTests = new Set(attempts.map((attempt) => attempt.testSlug)).size
  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0)

  return [
    ['Первый материал', 'Отметьте первый материал как изученный.', BookOpen, 'База', 50, completedMaterials.length, 1],
    ['Три материала', 'Изучите три карточки базы знаний.', BookCheck, 'База', 90, completedMaterials.length, 3],
    ['Десять материалов', 'Закройте десять материалов в библиотеке.', GraduationCap, 'Средний', 160, completedMaterials.length, 10],
    ['Полная библиотека', 'Изучите все доступные материалы.', Crown, 'Продвинутый', 350, completedMaterials.length, Math.max(materials.length, 1)],
    ['Первая закладка', 'Добавьте материал в закладки.', BookMarked, 'База', 40, bookmarkedMaterials.length, 1],
    ['Маршрут обучения', 'Соберите пять закладок.', Target, 'Средний', 120, bookmarkedMaterials.length, 5],
    ['Первый запуск', 'Пройдите первый тренажёр.', Rocket, 'База', 60, attempts.length, 1],
    ['Пять запусков', 'Запустите тренажёры пять раз.', Zap, 'База', 110, attempts.length, 5],
    ['Десять запусков', 'Наберите десять прохождений.', Flame, 'Средний', 180, attempts.length, 10],
    ['Разные тренажёры', 'Пройдите пять разных тренажёров.', Sparkles, 'Средний', 160, uniqueTests, 5],
    ['Score 700', 'Получите результат не ниже 700.', Medal, 'База', 100, bestScore, 700],
    ['Score 850', 'Получите результат не ниже 850.', Trophy, 'Средний', 190, bestScore, 850],
    ['Score 950', 'Получите результат не ниже 950.', Gem, 'Продвинутый', 320, bestScore, 950],
    ['Средний score 600', 'Поддерживайте средний score от 600.', ShieldHalf, 'База', 120, averageScore, 600],
    ['Средний score 800', 'Поддерживайте средний score от 800.', ShieldCheck, 'Средний', 220, averageScore, 800],
    ['1000 баллов суммарно', 'Накопите 1000 очков за тренировки.', Award, 'База', 90, totalScore, 1000],
    ['5000 баллов суммарно', 'Накопите 5000 очков за тренировки.', BadgeCheck, 'Средний', 220, totalScore, 5000],
    ['Пароли освоены', 'Изучите материалы по паролям.', KeyRound, 'База', 100, countCompletedByCategory(materials, completedMaterials, 'Пароли и учётные записи'), 3],
    ['Персональные данные', 'Изучите тему персональных данных.', ShieldCheck, 'База', 100, countCompletedByCategory(materials, completedMaterials, 'Персональные данные'), 3],
    ['Антифишинг', 'Изучите материалы по фишингу.', ShieldHalf, 'База', 100, countCompletedByCategory(materials, completedMaterials, 'Фишинг и мошенничество'), 3],
    ['Соцсети без риска', 'Закройте тему соцсетей и мессенджеров.', BadgeCheck, 'Средний', 130, countCompletedByCategory(materials, completedMaterials, 'Социальные сети и мессенджеры'), 3],
    ['Устройства защищены', 'Изучите безопасность устройств.', ShieldCheck, 'Средний', 130, countCompletedByCategory(materials, completedMaterials, 'Безопасность устройств'), 3],
    ['Wi‑Fi осторожность', 'Изучите публичные Wi‑Fi сети.', Zap, 'База', 100, countCompletedByCategory(materials, completedMaterials, 'Публичные сети Wi-Fi'), 3],
    ['Тренировка паролей', 'Пройдите тренировки по паролям.', KeyRound, 'База', 110, countAttemptsByCategory(attempts, tests, 'Пароли и учётные записи'), 2],
    ['Тренировка данных', 'Пройдите тренировки по персональным данным.', ShieldCheck, 'База', 110, countAttemptsByCategory(attempts, tests, 'Персональные данные'), 2],
    ['Фишинг распознан', 'Пройдите тренировки по фишингу.', ShieldHalf, 'Средний', 140, countAttemptsByCategory(attempts, tests, 'Фишинг и мошенничество'), 2],
    ['Неделя входов', 'Заходите в профиль 7 дней подряд.', CalendarCheck, 'Средний', 180, visitStreak, 7],
    ['Месяц дисциплины', 'Соберите серию из 30 дней.', Flame, 'Продвинутый', 420, visitStreak, 30],
    ['Пятнадцать материалов', 'Изучите пятнадцать материалов.', BookCheck, 'Средний', 220, completedMaterials.length, 15],
    ['Чемпион практики', 'Сделайте двадцать запусков тренажёров.', Trophy, 'Продвинутый', 380, attempts.length, 20],
  ].map(([title, description, icon, difficulty, points, current, target]) => ({
    title: title as string,
    description: description as string,
    icon: icon as ElementType,
    difficulty: difficulty as AchievementView['difficulty'],
    points: points as number,
    current: current as number,
    target: target as number,
  }))
}

function DailyRewardIcon({ streak }: { streak: number }) {
  if (streak >= 30) return <Crown size={30} />
  if (streak >= 14) return <Trophy size={30} />
  if (streak >= 7) return <Flame size={30} />
  if (streak >= 3) return <Star size={30} />
  return <CalendarCheck size={30} />
}

function WeeklyRewardIcon({ completedTasks }: { completedTasks: number }) {
  if (completedTasks >= 3) return <Crown size={30} />
  if (completedTasks >= 2) return <Trophy size={30} />
  return <Medal size={30} />
}

function ProfileEditor({
  currentUserEmail,
  hasRegisteredAccount,
  learnerName,
  role,
  onLogout,
  onSave,
}: {
  currentUserEmail: string
  hasRegisteredAccount: boolean
  learnerName: string
  role: string
  onLogout: () => Promise<void>
  onSave: (payload: { learnerName: string; role: string }) => Promise<void>
}) {
  const [draftLearnerName, setDraftLearnerName] = useState(learnerName)
  const [draftRole, setDraftRole] = useState(role)

  return (
    <article className="card profile-card">
      <h3>Данные профиля</h3>
      {hasRegisteredAccount ? (
        <div className="status-banner">Аккаунт: {currentUserEmail}</div>
      ) : (
        <div className="status-banner">
          Создайте аккаунт, чтобы сохранять результаты в персональном профиле.
          <Link to="/register" className="recommendation-link">
            Перейти к регистрации
          </Link>
        </div>
      )}
      <label className="field">
        <span>Имя или название команды</span>
        <input
          value={draftLearnerName}
          onChange={(event) => setDraftLearnerName(event.target.value)}
          disabled={!hasRegisteredAccount}
        />
      </label>
      <label className="field">
        <span>Роль / подразделение</span>
        <input
          value={draftRole}
          onChange={(event) => setDraftRole(event.target.value)}
          disabled={!hasRegisteredAccount}
        />
      </label>
      <button
        type="button"
        className="button button--primary"
        disabled={!hasRegisteredAccount}
        onClick={() => void onSave({ learnerName: draftLearnerName, role: draftRole })}
      >
        Сохранить профиль
      </button>
      {hasRegisteredAccount ? (
        <button type="button" className="button button--ghost" onClick={() => void onLogout()}>
          Выйти из аккаунта
        </button>
      ) : null}
    </article>
  )
}

function AchievementCard({ achievement }: { achievement: AchievementView }) {
  const Icon = achievement.icon
  const progress = clampProgress(achievement.current, achievement.target)
  const completed = progress >= 100

  return (
    <article className={`achievement-card ${completed ? 'achievement-card--done' : ''}`}>
      <div className="achievement-card__icon">
        <Icon size={20} />
      </div>
      <div>
        <div className="achievement-card__top">
          <strong>{achievement.title}</strong>
          <span className={`difficulty-tag difficulty-tag--${achievement.difficulty.toLowerCase()}`}>
            {achievement.difficulty}
          </span>
        </div>
        <p>{achievement.description}</p>
        <div className="achievement-card__progress">
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>
            {Math.min(achievement.current, achievement.target)}/{achievement.target} · {progress}%
          </small>
        </div>
      </div>
      <span className="achievement-card__points">+{achievement.points}</span>
    </article>
  )
}

function TaskCard({ task, period }: { task: TaskView; period: 'daily' | 'weekly' }) {
  const Icon = task.icon
  const progress = clampProgress(task.current, task.target)
  const completed = progress >= 100

  return (
    <article className={`task-card task-card--${period} ${completed ? 'task-card--done' : ''}`}>
      <div className="task-card__icon">
        <Icon size={19} />
      </div>
      <div>
        <div className="task-card__top">
          <strong>{task.title}</strong>
          <span>+{task.points} баллов</span>
        </div>
        <p>{task.description}</p>
        <div className="task-card__progress">
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>{completed ? 'Выполнено' : `${Math.min(task.current, task.target)}/${task.target}`}</small>
        </div>
      </div>
    </article>
  )
}

export function ProfilePage() {
  const { tests, materials } = useContentState()
  const { currentUserEmail, hasRegisteredAccount, logout, state, updateProfile } = usePlatformState()
  const { fontScale, setFontScale, setTheme, theme } = useTheme()
  const [searchParams] = useSearchParams()
  const [visitStreak, setVisitStreak] = useState(1)
  const recommended = getRecommendedTests(tests, state.attempts)
  const bookmarked = materials.filter((material) => state.bookmarkedMaterials.includes(material.slug))
  const averageScore = getAverageScore(state.attempts)
  const completedToday = state.completedMaterials.length
  const attemptsToday = state.attempts.length

  useEffect(() => {
    const nextStreak = updateVisitStreak().streak
    window.setTimeout(() => setVisitStreak(nextStreak), 0)
  }, [])

  useEffect(() => {
    const section = searchParams.get('section')
    if (!section) {
      return
    }

    requestAnimationFrame(() => {
      document.getElementById(`profile-${section}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [searchParams])

  const achievements = useMemo(
    () =>
      buildAchievements({
        attempts: state.attempts,
        bookmarkedMaterials: state.bookmarkedMaterials,
        completedMaterials: state.completedMaterials,
        materials,
        tests,
        visitStreak,
      }),
    [materials, state.attempts, state.bookmarkedMaterials, state.completedMaterials, tests, visitStreak],
  )
  const completedAchievements = achievements.filter(
    (achievement) => achievement.current >= achievement.target,
  ).length
  const achievementPoints = achievements
    .filter((achievement) => achievement.current >= achievement.target)
    .reduce((sum, achievement) => sum + achievement.points, 0)
  const dailyTasks: TaskView[] = [
    {
      title: 'Изучить материал',
      description: 'Отметьте любой материал как изученный сегодня.',
      icon: BookCheck,
      points: 40,
      current: completedToday,
      target: 1,
    },
    {
      title: 'Пройти тренировку',
      description: 'Завершите один тренажёр и сохраните результат.',
      icon: Target,
      points: 60,
      current: attemptsToday,
      target: 1,
    },
    {
      title: 'Добавить закладку',
      description: 'Сохраните полезный материал в личный маршрут.',
      icon: BookMarked,
      points: 25,
      current: state.bookmarkedMaterials.length,
      target: 1,
    },
  ]
  const weeklyTasks: TaskView[] = [
    {
      title: 'Пять материалов',
      description: 'Закройте пять материалов за неделю.',
      icon: GraduationCap,
      points: 180,
      current: state.completedMaterials.length,
      target: 5,
    },
    {
      title: 'Три тренировки',
      description: 'Пройдите три тренажёра за неделю.',
      icon: Rocket,
      points: 220,
      current: state.attempts.length,
      target: 3,
    },
    {
      title: 'Средний score 700',
      description: 'Удержите средний результат не ниже 700.',
      icon: ShieldCheck,
      points: 260,
      current: averageScore,
      target: 700,
    },
  ]
  const dailyPoints = dailyTasks
    .filter((task) => task.current >= task.target)
    .reduce((sum, task) => sum + task.points, 0)
  const weeklyPoints = weeklyTasks
    .filter((task) => task.current >= task.target)
    .reduce((sum, task) => sum + task.points, 0)
  const weeklyCompletedTasks = weeklyTasks.filter((task) => task.current >= task.target).length

  return (
    <div className="page profile-page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Профиль</span>
          <h1>Профиль обучения</h1>
          <p>
            Здесь собраны ваши результаты, закладки и рекомендации по следующим тренировкам.
          </p>
        </div>
        <div className="page-hero__aside">
          <div className="card compact-card">
            <strong>{state.attempts.length}</strong>
            <span>всего запусков</span>
          </div>
          <div className="card compact-card">
            <strong>{averageScore || '0'}</strong>
            <span>средний score</span>
          </div>
        </div>
      </section>

      <section className="section section--split" id="profile-progress">
        <ProfileEditor
          key={state.accountEmail || 'guest'}
          currentUserEmail={currentUserEmail}
          hasRegisteredAccount={hasRegisteredAccount}
          learnerName={state.learnerName}
          role={state.role}
          onLogout={logout}
          onSave={updateProfile}
        />

        <div className="detail-column">
          <article className="card feature-card">
            <h3 id="profile-recommendations">Рекомендовано дальше</h3>
            <div className="recommendation-stack">
              {recommended.map((test) => (
                <Link key={test.slug} to={`/tests/${test.slug}`} className="recommendation-link">
                  {test.title}
                </Link>
              ))}
            </div>
          </article>
          <article className="card feature-card">
            <h3>Изучено материалов</h3>
            <p>{state.completedMaterials.length} карточек отмечено как завершённые.</p>
          </article>
        </div>
      </section>

      <section className="section" id="profile-settings">
        <article className="card profile-settings-card">
          <div>
            <span className="eyebrow">Настройки</span>
            <h3>Внешний вид</h3>
            <p>Настройте тему интерфейса и удобный размер текста.</p>
          </div>
          <div className="profile-settings-grid">
            <div className="settings-control">
              <div>
                <Sun size={20} />
                <strong>Тема</strong>
              </div>
              <div className="segmented-control">
                <button
                  type="button"
                  className={theme === 'light' ? 'is-active' : ''}
                  onClick={() => setTheme('light')}
                >
                  Светлая
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'is-active' : ''}
                  onClick={() => setTheme('dark')}
                >
                  Тёмная
                </button>
              </div>
            </div>
            <div className="settings-control">
              <div>
                <Type size={20} />
                <strong>Размер шрифта</strong>
              </div>
              <div className="segmented-control segmented-control--three">
                <button
                  type="button"
                  className={fontScale === 'small' ? 'is-active' : ''}
                  onClick={() => setFontScale('small')}
                >
                  Меньше
                </button>
                <button
                  type="button"
                  className={fontScale === 'normal' ? 'is-active' : ''}
                  onClick={() => setFontScale('normal')}
                >
                  Обычно
                </button>
                <button
                  type="button"
                  className={fontScale === 'large' ? 'is-active' : ''}
                  onClick={() => setFontScale('large')}
                >
                  Больше
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="section profile-rewards">
        <div className="card reward-card reward-card--daily">
          <div className="reward-card__icon reward-card__icon--streak">
            <DailyRewardIcon streak={visitStreak} />
          </div>
          <div>
            <span className="eyebrow">Ежедневная награда</span>
            <h3>{visitStreak} дней подряд</h3>
            <p>
              Заходите каждый день: серия растёт, а иконка награды становится сильнее на 3, 7, 14
              и 30 днях.
            </p>
          </div>
          <div className="reward-card__meta">
            <strong>+{20 + Math.min(visitStreak, 30) * 5}</strong>
            <span>баллов за визит</span>
          </div>
        </div>

        <div className="card reward-card">
          <div className="reward-card__icon reward-card__icon--weekly">
            <WeeklyRewardIcon completedTasks={weeklyCompletedTasks} />
          </div>
          <div>
            <span className="eyebrow">Еженедельная награда</span>
            <h3>{weeklyCompletedTasks}/3 задания</h3>
            <p>Закройте все еженедельные задачи, чтобы получить максимальную награду недели.</p>
          </div>
          <div className="reward-card__meta">
            <strong>+{weeklyPoints}</strong>
            <span>баллов за неделю</span>
          </div>
        </div>

        <div className="card reward-card">
          <div>
            <span className="eyebrow">Баллы за задания</span>
            <h3>{dailyPoints + weeklyPoints}</h3>
            <p>Начисляются за выполненные ежедневные и еженедельные обязательные задания.</p>
          </div>
          <div className="reward-card__split">
            <span>День: +{dailyPoints}</span>
            <span>Неделя: +{weeklyPoints}</span>
          </div>
        </div>
      </section>

      <section className="section section--split">
        <article className="card task-board">
          <div className="task-board__header">
            <div>
              <span className="eyebrow">Обязательные задания</span>
              <h3>Ежедневные</h3>
            </div>
            <span className="status-badge">+{dailyPoints} получено</span>
          </div>
          <div className="task-list">
            {dailyTasks.map((task) => (
              <TaskCard key={task.title} task={task} period="daily" />
            ))}
          </div>
        </article>

        <article className="card task-board">
          <div className="task-board__header">
            <div>
              <span className="eyebrow">Обязательные задания</span>
              <h3>Еженедельные</h3>
            </div>
            <span className="status-badge">+{weeklyPoints} получено</span>
          </div>
          <div className="task-list">
            {weeklyTasks.map((task) => (
              <TaskCard key={task.title} task={task} period="weekly" />
            ))}
          </div>
        </article>
      </section>

      <section className="section" id="profile-achievements">
        <details className="card achievements-panel">
          <summary>
            <div>
              <span className="eyebrow">Достижения</span>
              <h3>Коллекция наград</h3>
              <p>
                {completedAchievements}/30 открыто · +{achievementPoints} баллов за завершённые
                достижения
              </p>
            </div>
            <ChevronDown size={22} />
          </summary>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.title} achievement={achievement} />
            ))}
          </div>
        </details>
      </section>

      <section className="section section--split">
        <article className="card history-card">
          <h3>Последняя активность</h3>
          {state.attempts.length ? (
            <div className="history-card__list">
              {state.attempts.slice(0, 8).map((attempt) => (
                <div key={attempt.id} className="history-card__row">
                  <div>
                    <strong>{attempt.label}</strong>
                    <small>{attempt.summary}</small>
                    <small>{formatLongDate(attempt.createdAt)}</small>
                  </div>
                  <span>{attempt.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Запустите любой тренажёр, чтобы здесь появились попытки и статистика.</p>
          )}
        </article>

        <article className="card history-card">
          <h3>Закладки</h3>
          {bookmarked.length ? (
            <div className="history-card__list">
              {bookmarked.map((material) => (
                <div key={material.slug} className="history-card__row">
                  <div>
                    <strong>{material.title}</strong>
                    <small>{material.category}</small>
                  </div>
                  <Link to={`/materials/${material.slug}`} className="button button--ghost">
                    Открыть
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>Добавьте материалы в закладки, чтобы собирать собственный маршрут обучения.</p>
          )}
        </article>
      </section>
    </div>
  )
}
