import { ArrowRight, Clock3, Signal } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CyberTest, StoredAttempt } from '../types'
import { formatScore, getBestAttempt } from '../utils/platform'

export function TestCard({
  test,
  attempts,
}: {
  test: CyberTest
  attempts: StoredAttempt[]
}) {
  const bestAttempt = getBestAttempt(test.slug, attempts)

  return (
    <article className="card test-card">
      <div className="card__meta">
        <span className="pill" style={{ background: `${test.accent}1f`, color: test.accent }}>
          {test.tag}
        </span>
        <span>{test.category}</span>
      </div>

      <h3>{test.title}</h3>
      <p>{test.description}</p>

      <div className="test-card__chips">
        <span>
          <Clock3 size={14} />
          {test.duration}
        </span>
        <span>
          <Signal size={14} />
          {test.metric}
        </span>
      </div>

      <ul className="stack-list">
        {test.deck.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="card__footer">
        <div>
          <small>Лучший результат</small>
          <strong>{bestAttempt ? formatScore(bestAttempt.score) : 'ещё нет запусков'}</strong>
        </div>
        <Link
          to={`/tests/${test.slug}`}
          className={`button ${test.status === 'playable' ? 'button--primary' : 'button--ghost'}`}
        >
          {test.status === 'playable' ? 'Открыть' : 'Подробнее'}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  )
}
