import { useEffect, useRef, useState } from 'react'
import type { AttemptPayload } from '../../types'

interface ReflexSample {
  title: string
  sender: string
  clue: string
  malicious: boolean
}

interface ReflexResult {
  answer?: boolean
  correct: boolean
  reaction: number
  sample: ReflexSample
}

const samples: ReflexSample[] = [
  {
    title: 'Срочно: подтвердите MFA до 18:00',
    sender: 'sec-portal@company-auth.net',
    clue: 'Домен отличается от корпоративного на одно слово.',
    malicious: true,
  },
  {
    title: 'Запланированная смена пароля через внутренний портал',
    sender: 'it-support@intra.company.ru',
    clue: 'Корректный домен и ожидаемый процесс в рамках регламента.',
    malicious: false,
  },
  {
    title: 'Подпишите зарплатную ведомость по новой ссылке',
    sender: 'finance-ops@secure-payroll.help',
    clue: 'Давление по времени и внешний адрес вместо привычного HR-портала.',
    malicious: true,
  },
  {
    title: 'Успешно создан инцидент в helpdesk',
    sender: 'noreply@tickets.company.ru',
    clue: 'Стандартное внутреннее уведомление с ожидаемым шаблоном.',
    malicious: false,
  },
  {
    title: 'Откройте приложение к письму для просмотра VPN-ключа',
    sender: 'network-core@fileshare-security.app',
    clue: 'Подозрительное вложение и нештатная процедура передачи ключей.',
    malicious: true,
  },
  {
    title: 'Напоминание: обновление агента EDR завершено',
    sender: 'secops@intra.company.ru',
    clue: 'Внутренний адрес и плановое событие из операционного календаря.',
    malicious: false,
  },
]

export function ReflexDrill({
  bestScore,
  onComplete,
}: {
  bestScore?: number
  onComplete: (payload: AttemptPayload) => void
}) {
  const [stage, setStage] = useState<'idle' | 'arming' | 'active' | 'done'>('idle')
  const [round, setRound] = useState(0)
  const [currentSample, setCurrentSample] = useState<ReflexSample>(samples[0])
  const [note, setNote] = useState('Нажмите старт и дождитесь появления письма.')
  const [results, setResults] = useState<ReflexResult[]>([])
  const [summary, setSummary] = useState<{
    accuracy: number
    averageReaction: number
    correct: number
    score: number
    wrong: number
  } | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const visibleAtRef = useRef(0)

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const armRound = (nextRound: number) => {
    clearTimer()
    const sample = samples[Math.floor(Math.random() * samples.length)]
    setCurrentSample(sample)
    setRound(nextRound)
    setStage('arming')
    setNote('Ждите. Слишком ранний клик считается ошибкой.')

    timeoutRef.current = window.setTimeout(() => {
      visibleAtRef.current = performance.now()
      setStage('active')
      setNote('Письмо пришло. Классифицируйте его.')
    }, 1300 + Math.random() * 1500)
  }

  useEffect(() => () => clearTimer(), [])

  const finish = (finalResults: ReflexResult[]) => {
    const correct = finalResults.filter((item) => item.correct).length
    const wrong = finalResults.length - correct
    const accuracy = correct / finalResults.length
    const averageReaction = Math.round(
      finalResults.reduce((sum, item) => sum + item.reaction, 0) / finalResults.length,
    )
    const score = Math.round(accuracy * 600 + Math.max(0, 520 - averageReaction) * 1.25)

    setSummary({ accuracy, averageReaction, correct, score, wrong })
    setStage('done')
    setNote('Серия завершена. Разберите ошибки и перезапустите тренировку, если нужно.')
    onComplete({
      score,
      label: `${correct}/${finalResults.length} верно`,
      summary: `Ошибок: ${wrong}. Среднее время ${averageReaction} мс, точность ${Math.round(accuracy * 100)}%.`,
    })
  }

  const start = () => {
    setResults([])
    setSummary(null)
    armRound(0)
  }

  const handleDecision = (answer: boolean) => {
    if (stage === 'arming') {
      clearTimer()
      const penalty = [...results, { correct: false, reaction: 900, sample: currentSample }]
      setResults(penalty)

      if (penalty.length >= 5) {
        finish(penalty)
        return
      }

      setNote('Слишком рано. Это ложная реакция.')
      armRound(penalty.length)
      return
    }

    if (stage !== 'active') {
      return
    }

    const reaction = Math.round(performance.now() - visibleAtRef.current)
    const nextResults = [
      ...results,
      {
        answer,
        correct: answer === currentSample.malicious,
        reaction,
        sample: currentSample,
      },
    ]
    setResults(nextResults)

    if (nextResults.length >= 5) {
      finish(nextResults)
      return
    }

    armRound(nextResults.length)
  }

  const wrongResults = results.filter((result) => !result.correct)

  return (
    <section className="game-panel">
      <div className="game-panel__header">
        <div>
          <span className="eyebrow">Тренажёр реакции</span>
          <h3>Серия из 5 входящих событий</h3>
        </div>
        <div className="game-panel__metrics">
          <span>Раунд {Math.min(round + (stage === 'idle' ? 0 : 1), 5)}/5</span>
          <span>Лучший score: {bestScore ?? 'нет'}</span>
        </div>
      </div>

      {stage === 'done' && summary ? (
        <div className="reflex-result">
          <div className="reflex-result__summary">
            <div>
              <span>Score</span>
              <strong>{summary.score}</strong>
            </div>
            <div>
              <span>Правильно</span>
              <strong>{summary.correct}</strong>
            </div>
            <div>
              <span>Неправильно</span>
              <strong>{summary.wrong}</strong>
            </div>
            <div>
              <span>Среднее время</span>
              <strong>{summary.averageReaction} мс</strong>
            </div>
          </div>

          <div className="reflex-result__review">
            <h4>Разбор ошибок</h4>
            {wrongResults.length ? (
              <div className="reflex-review-list">
                {wrongResults.map((result, index) => (
                  <article className="reflex-review-card" key={`${result.sample.title}-${index}`}>
                    <small>Ошибка {index + 1}</small>
                    <h5>{result.sample.title}</h5>
                    <p>{result.sample.sender}</p>
                    <div>
                      <span>
                        Ваш ответ:{' '}
                        {result.answer === undefined
                          ? 'слишком ранний клик'
                          : result.answer
                            ? 'Фишинг'
                            : 'Безопасно'}
                      </span>
                      <span>Правильно: {result.sample.malicious ? 'Фишинг' : 'Безопасно'}</span>
                    </div>
                    <strong>{result.sample.clue}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <p>Ошибок нет. Все письма классифицированы верно.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={`signal-card signal-card--${stage}`}>
          <small>{stage === 'active' ? 'Входящее письмо' : 'Ожидание сигнала'}</small>
          <h4>{stage === 'active' ? currentSample.title : '...'}</h4>
          <p>{stage === 'active' ? currentSample.sender : 'Сценарий появится через случайную задержку.'}</p>
          <span>{stage === 'active' ? currentSample.clue : 'Держите внимание на экране.'}</span>
        </div>
      )}

      <p className="game-panel__note">{note}</p>

      {stage === 'idle' || stage === 'done' ? (
        <div className="game-panel__actions">
          <button type="button" className="button button--primary" onClick={start}>
            {stage === 'done' ? 'Пройти ещё раз' : 'Старт'}
          </button>
        </div>
      ) : (
        <div className="game-panel__actions game-panel__actions--decision">
          <button type="button" className="button button--danger" onClick={() => handleDecision(true)}>
            Фишинг
          </button>
          <button type="button" className="button button--ghost" onClick={() => handleDecision(false)}>
            Безопасно
          </button>
        </div>
      )}

      <div className="mini-grid">
        {results.map((result, index) => (
          <div key={`${result.reaction}-${index}`} className="mini-grid__item">
            <strong>{result.correct ? 'OK' : 'Miss'}</strong>
            <span>{result.reaction} мс</span>
          </div>
        ))}
      </div>
    </section>
  )
}
