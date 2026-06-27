import { AlertTriangle, CheckCircle2, ChevronLeft, Rocket } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PasswordLab } from '../components/games/PasswordLab'
import { PhishingLab } from '../components/games/PhishingLab'
import { PriorityDrill } from '../components/games/PriorityDrill'
import { PrivacyLab } from '../components/games/PrivacyLab'
import { QuizDrill } from '../components/games/QuizDrill'
import { ReflexDrill } from '../components/games/ReflexDrill'
import { SequenceDrill } from '../components/games/SequenceDrill'
import { getAwarenessProgress } from '../components/games/awarenessGameUtils'
import { useContentState } from '../hooks/useContentState'
import { usePlatformState } from '../hooks/usePlatformState'
import { createAttempt, formatLongDate, getBestAttempt } from '../utils/platform'

export function TestDetailPage() {
  const { slug } = useParams()
  const { tests } = useContentState()
  const { state, saveAttempt } = usePlatformState()
  const test = tests.find((item) => item.slug === slug)

  if (!test) {
    return <Navigate to="/tests" replace />
  }

  const attempts = state.attempts.filter((attempt) => attempt.testSlug === test.slug)
  const bestAttempt = getBestAttempt(test.slug, state.attempts)
  const overallProgress = getAwarenessProgress(state.attempts)

  const persistAttempt = (score: Parameters<typeof createAttempt>[1]) => {
    saveAttempt(createAttempt(test, score))
  }

  return (
    <div className="page">
      <section className="detail-hero">
        <div>
          <Link to="/tests" className="detail-hero__back">
            <ChevronLeft size={16} />
            Ко всем тестам
          </Link>
          <span className="eyebrow">{test.tag}</span>
          <h1>{test.title}</h1>
          <p>{test.headline}</p>
          <div className="detail-hero__chips">
            <span>{test.category}</span>
            <span>{test.difficulty}</span>
            <span>{test.duration}</span>
            <span>{test.metric}</span>
          </div>
        </div>
        <div className="card detail-hero__aside">
          <div className="card__meta">
            <span className="pill">Формат</span>
            <span>{test.status === 'playable' ? 'Доступен' : 'Скоро'}</span>
          </div>
          <ul className="stack-list">
            {test.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
          <div className="detail-hero__summary">
            <div>
              <small>Лучший результат</small>
              <strong>{bestAttempt?.score ?? 'ещё нет'}</strong>
            </div>
            <div>
              <small>Последний запуск</small>
              <strong>{attempts[0] ? formatLongDate(attempts[0].createdAt) : 'не запускался'}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--split">
        <div>
          {test.status === 'playable' ? (
            <>
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
              {test.mode === 'password' ? (
                <PasswordLab
                  bestScore={bestAttempt?.score}
                  overallProgress={overallProgress}
                  onComplete={persistAttempt}
                />
              ) : null}
              {test.mode === 'phishing' ? (
                <PhishingLab
                  bestScore={bestAttempt?.score}
                  overallProgress={overallProgress}
                  onComplete={persistAttempt}
                />
              ) : null}
              {test.mode === 'privacy' ? (
                <PrivacyLab
                  bestScore={bestAttempt?.score}
                  overallProgress={overallProgress}
                  onComplete={persistAttempt}
                />
              ) : null}
            </>
          ) : (
            <article className="card prep-card">
              <AlertTriangle size={20} />
              <h3>Сценарий появится в ближайшем обновлении</h3>
              <p>
                Этот формат уже запланирован в каталоге. Пока можно пройти доступные тренажёры и
                вернуться к сценарию позже.
              </p>
              <div className="prep-card__actions">
                <Link to="/materials" className="button button--ghost">
                  Открыть материалы
                </Link>
                <Link to="/profile" className="button button--primary">
                  Посмотреть профиль
                </Link>
              </div>
            </article>
          )}
        </div>

        <div className="detail-column">
          <article className="card feature-card">
            <Rocket size={20} />
            <h3>Динамичный формат</h3>
            <p>
              Раунды, таймер и история попыток помогают тренироваться сериями и видеть собственный
              прогресс.
            </p>
          </article>
          <article className="card feature-card">
            <CheckCircle2 size={20} />
            <h3>Практическая ценность</h3>
            <p>
              Сценарии опираются на типовые задачи команды: triage, phishing, hardening и
              приоритизацию.
            </p>
          </article>
          <article className="card history-card">
            <h3>История попыток</h3>
            {attempts.length ? (
              <div className="history-card__list">
                {attempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="history-card__row">
                    <div>
                      <strong>{attempt.label}</strong>
                      <small>{attempt.summary}</small>
                    </div>
                    <span>{attempt.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>После первого прохождения здесь появятся результаты и динамика.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  )
}
