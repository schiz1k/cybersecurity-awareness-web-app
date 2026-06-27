import { useCallback, useEffect, useRef, useState } from 'react'
import type { AttemptPayload } from '../../types'

interface TaskCard {
  id: string
  title: string
  severity: number
  detail: string
}

const pool: TaskCard[] = [
  { id: 'rce', title: 'RCE на edge-сервисе', severity: 10, detail: 'Интернет-доступен, эксплойт уже в паблике.' },
  { id: 'vpn', title: 'Слабая MFA-политика VPN', severity: 9, detail: 'Высокий риск компрометации доступа.' },
  { id: 'pii', title: 'Утечка PII в S3 bucket', severity: 8, detail: 'Публичное чтение без авторизации.' },
  { id: 'api', title: 'Повышение привилегий в API', severity: 8, detail: 'Затрагивает внутренние кабинеты.' },
  { id: 'ci', title: 'Старый runner в CI', severity: 7, detail: 'Есть lateral movement через токены.' },
  { id: 'dns', title: 'Ошибочная DNS-запись', severity: 5, detail: 'Ломает часть мониторинга, но не даёт доступ.' },
  { id: 'tls', title: 'Просроченный TLS на тестовом домене', severity: 4, detail: 'Низкий бизнес-импакт.' },
  { id: 'wiki', title: 'Открытый внутренний wiki', severity: 6, detail: 'Нужна сегментация и SSO.' },
]

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

export function PriorityDrill({
  bestScore,
  onComplete,
}: {
  bestScore?: number
  onComplete: (payload: AttemptPayload) => void
}) {
  const [cards, setCards] = useState<TaskCard[]>(shuffle(pool))
  const [running, setRunning] = useState(false)
  const [resolved, setResolved] = useState<string[]>([])
  const [penalties, setPenalties] = useState(0)
  const [timeLeft, setTimeLeft] = useState(24)
  const [note, setNote] = useState('Нажимайте карточки в порядке убывания риска.')
  const resolvedRef = useRef(0)
  const penaltiesRef = useRef(0)

  const order = [...cards].sort((left, right) => right.severity - left.severity)

  useEffect(() => {
    resolvedRef.current = resolved.length
  }, [resolved.length])

  useEffect(() => {
    penaltiesRef.current = penalties
  }, [penalties])

  const finish = useCallback(
    (resolvedCount: number, leftSeconds: number, wrongClicks: number) => {
      setRunning(false)
      const score = resolvedCount * 120 + leftSeconds * 18 - wrongClicks * 35
      onComplete({
        score,
        label: `${resolvedCount}/${cards.length} задач`,
        summary: `Штрафов: ${wrongClicks}, остаток таймера: ${leftSeconds} сек.`,
      })
      setNote('Раунд завершён. Можно перезапустить очередь.')
    },
    [cards.length, onComplete],
  )

  useEffect(() => {
    if (!running) {
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          finish(resolvedRef.current, 0, penaltiesRef.current)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [finish, running])

  const start = () => {
    setCards(shuffle(pool))
    setResolved([])
    setPenalties(0)
    setTimeLeft(24)
    setRunning(true)
    setNote('Старт. Сначала гасите наиболее критичную задачу.')
  }

  const handleClick = (card: TaskCard) => {
    if (!running || resolved.includes(card.id)) {
      return
    }

    const expected = order[resolved.length]

    if (expected.id === card.id) {
      const nextResolved = [...resolved, card.id]
      setResolved(nextResolved)

      if (nextResolved.length === cards.length) {
        finish(nextResolved.length, timeLeft, penalties)
      }
      return
    }

    setPenalties((current) => current + 1)
    setNote(`Неверный приоритет. Сначала нужно решить: ${expected.title}.`)
  }

  return (
    <section className="game-panel">
      <div className="game-panel__header">
        <div>
          <span className="eyebrow">Ops sprint</span>
          <h3>Очередь патчей и mitigations</h3>
        </div>
        <div className="game-panel__metrics">
          <span>Таймер {timeLeft} сек</span>
          <span>Лучший score: {bestScore ?? 'нет'}</span>
        </div>
      </div>

      <p className="game-panel__note">{note}</p>

      <div className="priority-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`priority-card ${resolved.includes(card.id) ? 'priority-card--done' : ''}`}
            onClick={() => handleClick(card)}
          >
            <strong>{card.title}</strong>
            <span>CVSS {card.severity}.0</span>
            <p>{card.detail}</p>
          </button>
        ))}
      </div>

      <div className="game-panel__actions">
        <button type="button" className="button button--primary" onClick={start}>
          {running ? 'Перезапустить' : 'Запустить'}
        </button>
        <span className="inline-hint">
          Выполнено: {resolved.length}/{cards.length} · штрафы: {penalties}
        </span>
      </div>
    </section>
  )
}
