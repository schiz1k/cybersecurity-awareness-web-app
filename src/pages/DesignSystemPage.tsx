import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  Flame,
  ListChecks,
  LockKeyhole,
  Search,
  ShieldCheck,
  TimerReset,
  Trophy,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useContentState } from '../hooks/useContentState'
import { useLeaderboardState } from '../hooks/useLeaderboardState'
import { usePlatformState } from '../hooks/usePlatformState'
import { formatLongDate, formatScore, getAverageScore, getBestAttempt } from '../utils/platform'

const colorTokens = [
  { value: '#1F3A8A', label: 'Основной синий' },
  { value: '#3882F6', label: 'Акцентный синий' },
  { value: '#CBD5E1', label: 'Светло-серый фон' },
  { value: '#FFFFFF', label: 'Белый фон' },
  { value: '#0F1E3A', label: 'Основной текст' },
  { value: '#64748B', label: 'Вторичный текст' },
]

const fallbackHistory = [
  ['24.05.2024 14:32', 'Фишинг-Рефлекс', '85%', '850'],
  ['24.05.2024 10:12', 'Цепочка инцидента', '78%', '780'],
  ['23.05.2024 16:45', 'Патч-Приоритет', '92%', '920'],
  ['23.05.2024 11:20', 'Фишинг-Рефлекс', '88%', '880'],
]

function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="concept-ring" style={{ '--value': `${value}%` } as React.CSSProperties}>
      <span>{label}</span>
    </div>
  )
}

export function DesignSystemPage() {
  const { tests } = useContentState()
  const { leaderboard } = useLeaderboardState()
  const { state } = usePlatformState()
  const featuredTests = tests.filter((test) => test.status === 'playable').slice(0, 3)
  const spotlightTest = tests.find((test) => test.slug === 'phishing-reflex') ?? featuredTests[0]
  const bestAttempt = spotlightTest ? getBestAttempt(spotlightTest.slug, state.attempts) : undefined
  const averageScore = getAverageScore(state.attempts)
  const historyRows = state.attempts.length
    ? state.attempts.slice(0, 4).map((attempt) => [
        formatLongDate(attempt.createdAt),
        attempt.label,
        `${Math.round(attempt.score / 10)}%`,
        String(attempt.score),
      ])
    : fallbackHistory

  return (
    <div className="page page--home concept-page">
      <div className="concept-board">
        <aside className="concept-sidebar">
          <section className="concept-hero">
            <h1>
              ФИШИНГ-
              <br />
              РЕФЛЕКС
            </h1>
            <p>Отработайте мгновенное распознавание вредоносных сигналов.</p>
            <div className="concept-actions">
              <Link to="/tests/phishing-reflex" className="button button--primary">
                Начать тренировку
              </Link>
              <Link to="/materials" className="button button--ghost">
                Открыть материалы
              </Link>
            </div>
          </section>

          <section className="design-kit-block">
            <h2>Цвета</h2>
            <div className="swatch-grid">
              {colorTokens.map((token) => (
                <div key={token.value} className="swatch-item">
                  <span className="swatch-item__color" style={{ background: token.value }} />
                  <strong>{token.value}</strong>
                  <small>{token.label}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="design-kit-block">
            <h2>Типографика: Montserrat</h2>
            <div className="type-scale">
              <div>
                <strong className="type-scale__h1">Заголовок H1</strong>
                <span>48/64 Bold</span>
              </div>
              <div>
                <strong className="type-scale__h2">Заголовок H2</strong>
                <span>28/36 Bold</span>
              </div>
              <div>
                <strong className="type-scale__h3">Заголовок H3</strong>
                <span>18/22 SemiBold</span>
              </div>
              <div>
                <strong>Основной текст</strong>
                <span>16 Regular</span>
              </div>
              <div>
                <strong>Вторичный текст</strong>
                <span>14 Regular</span>
              </div>
            </div>
          </section>

          <section className="design-kit-block">
            <h2>Кнопки</h2>
            <div className="button-samples">
              <button type="button" className="button button--primary">
                Кнопка
              </button>
              <button type="button" className="button button--ghost">
                Кнопка
              </button>
              <button type="button" className="button button--link">
                Кнопка
              </button>
              <button type="button" className="button button--danger">
                Кнопка
              </button>
            </div>
          </section>

          <section className="design-kit-block">
            <h2>Иконки</h2>
            <div className="icon-strip">
              <ShieldCheck />
              <LockKeyhole />
              <BookOpenText />
              <Trophy />
              <ListChecks />
              <Search />
              <Clock3 />
            </div>
          </section>
        </aside>

        <section className="concept-panel panel--forms">
          <div className="panel-column">
            <h2>Поля ввода</h2>
            <label className="field">
              <span>Текстовое поле</span>
              <input placeholder="Введите текст" />
            </label>
            <label className="field">
              <span>Фокус</span>
              <input className="is-focused" placeholder="Введите текст" />
            </label>
            <label className="field field--error">
              <span>С ошибкой</span>
              <input placeholder="Введите текст" />
              <small>Введите корректное значение</small>
            </label>
            <label className="field field--search">
              <span>С иконкой</span>
              <div>
                <Search size={16} />
                <input placeholder="Поиск по названию..." />
              </div>
            </label>
            <label className="field">
              <span>Текстовая область</span>
              <textarea placeholder="Введите текст..." />
            </label>
          </div>

          <div className="panel-column">
            <h2>Выпадающий список</h2>
            <div className="select-preview">
              <span>Выберите значение</span>
              <ChevronRight size={16} />
            </div>
            <div className="dropdown-preview">
              <button type="button">Опция 1</button>
              <button type="button" className="is-active">
                Опция 2 <ChevronRight size={16} />
              </button>
              <button type="button">Опция 3</button>
              <button type="button">Опция 4</button>
            </div>

            <h2>Чекбоксы и радиокнопки</h2>
            <div className="control-grid">
              <label>
                <input type="checkbox" /> Обычный чекбокс
              </label>
              <label>
                <input type="radio" name="demo" defaultChecked /> Выбранный вариант
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Активный чекбокс
              </label>
              <label>
                <input type="radio" name="demo" /> Обычный вариант
              </label>
              <label className="is-disabled">
                <input type="checkbox" disabled /> Неактивный чекбокс
              </label>
              <label className="is-disabled">
                <input type="radio" disabled /> Неактивный вариант
              </label>
            </div>
          </div>
        </section>

        <section className="concept-panel panel--status">
          <h2>Таймер / обратный отсчёт</h2>
          <div className="timer-grid">
            <article className="timer-card">
              <ProgressRing value={72} label="" />
              <div>
                <small>Время на задание</small>
                <strong>04:35</strong>
                <span>мин сек</span>
              </div>
            </article>
            <article className="timer-card">
              <ProgressRing value={84} label="" />
              <div>
                <small>До конца тренировки</small>
                <strong>12:48</strong>
                <span>мин сек</span>
              </div>
            </article>
          </div>

          <h2>Теги / бейджи</h2>
          <div className="badge-cloud">
            <span className="badge badge--blue">Новый</span>
            <span className="badge badge--green">Рекомендован</span>
            <span className="badge badge--orange">Популярный</span>
            <span className="badge badge--red">Сложный</span>
            <span className="badge badge--mint">Лёгкий</span>
            <span className="badge badge--soft">+12</span>
          </div>

          <h2>Прогресс</h2>
          <div className="progress-card">
            <div className="progress-card__meta">
              <span>Прогресс бар</span>
              <strong>75%</strong>
            </div>
            <div className="progress">
              <span style={{ width: '75%' }} />
            </div>
          </div>
          <div className="steps">
            {['Выбор', 'Настройка', 'Тренировка', 'Результат'].map((step, index) => (
              <div key={step} className={index < 2 ? 'is-complete' : ''}>
                <span>{index + 1}</span>
                <small>{step}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="concept-panel panel--cards">
          <h2>Карточки</h2>
          <div className="training-card-grid">
            {featuredTests.map((test) => {
              const best = getBestAttempt(test.slug, state.attempts)

              return (
                <article key={test.slug} className="mini-training-card">
                  <span className="mini-training-card__icon" style={{ color: test.accent }}>
                    {test.mode === 'reflex' ? <Zap /> : test.mode === 'sequence' ? <ListChecks /> : <FileText />}
                  </span>
                  <h3>{test.title}</h3>
                  <p>{test.description}</p>
                  <div className="mini-training-card__meta">
                    <span>
                      <Clock3 size={14} />
                      {test.duration}
                    </span>
                    <span>{best ? formatScore(best.score) : test.difficulty}</span>
                  </div>
                  <Link to={`/tests/${test.slug}`} className="button button--primary">
                    Начать тренировку
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        <section className="concept-panel panel--leaders">
          <h2>Лидеры текущего потока</h2>
          <div className="leader-mini-list">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div key={`${entry.name}-${entry.track}`}>
                <span>#{index + 1}</span>
                <strong>{entry.name}</strong>
                <small>{entry.track}</small>
                <b>{entry.score}</b>
              </div>
            ))}
          </div>
          <Link to="/leaderboard" className="inline-link">
            Посмотреть весь рейтинг <ArrowRight size={16} />
          </Link>
        </section>

        <section className="concept-panel panel--training">
          <h2>Пример экранов</h2>
          <div className="training-preview">
            <div className="training-preview__rail">
              <ShieldCheck size={18} />
              <Search size={18} />
              <LockKeyhole size={18} />
              <Trophy size={18} />
            </div>
            <div className="training-preview__screen">
              <div className="training-preview__top">
                <span>Тренировка: Фишинг-Рефлекс</span>
                <strong>04:35</strong>
              </div>
              <div className="progress">
                <span style={{ width: '55%' }} />
              </div>
              <h3>Какой признак указывает, что это фишинговое письмо?</h3>
              {[
                'Отправитель использует официальный домен компании',
                'Приветствие содержит ваше полное имя',
                'Ссылка ведёт на подозрительный домен',
                'В письме нет вложений',
              ].map((option, index) => (
                <button key={option} type="button" className={index === 2 ? 'is-selected' : ''}>
                  {index === 2 ? <Check size={15} /> : <Circle size={15} />}
                  {option}
                </button>
              ))}
              <div className="training-preview__actions">
                <button type="button" className="button button--ghost">
                  Пропустить
                </button>
                <button type="button" className="button button--primary">
                  Далее
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="concept-panel panel--result">
          <h2>Результаты тренировки</h2>
          <div className="result-layout">
            <article className="score-card">
              <ProgressRing value={85} label={bestAttempt ? String(bestAttempt.score) : '850'} />
              <small>из 1000</small>
              <strong>Отлично! Продолжайте в том же темпе.</strong>
              <Link to="/profile" className="button button--primary">
                Посмотреть разбор
              </Link>
            </article>
            <article className="result-stats">
              <div>
                <ShieldCheck size={16} />
                <span>Правильных ответов</span>
                <strong>{averageScore ? `${Math.round(averageScore / 10)}%` : '85%'}</strong>
              </div>
              <div>
                <TimerReset size={16} />
                <span>Время</span>
                <strong>03:42</strong>
              </div>
              <div>
                <Flame size={16} />
                <span>Серия</span>
                <strong>+50 очков</strong>
              </div>
            </article>
          </div>
        </section>

        <section className="concept-panel panel--history">
          <h2>История попыток</h2>
          <div className="attempt-table">
            <div>
              <span>Дата и время</span>
              <span>Режим</span>
              <span>Результат</span>
              <span>Баллы</span>
            </div>
            {historyRows.map((row) => (
              <div key={`${row[0]}-${row[1]}`}>
                {row.map((cell) => (
                  <span key={cell}>{cell}</span>
                ))}
              </div>
            ))}
          </div>
          <Link to="/profile" className="inline-link">
            Посмотреть всю историю <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  )
}
