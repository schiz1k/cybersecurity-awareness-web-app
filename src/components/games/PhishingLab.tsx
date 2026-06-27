import { CheckCircle2, Mail, MessageSquareText, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AttemptPayload } from '../../types'
import {
  clampScore,
  formatAwarenessProgress,
  getAwarenessRank,
} from './awarenessGameUtils'

interface PhishingLabProps {
  bestScore?: number
  overallProgress: {
    completed: number
    total: number
  }
  onComplete: (payload: AttemptPayload) => void
}

interface SignOption {
  id: string
  label: string
}

interface SpotCard {
  kind: 'email' | 'chat' | 'notice'
  from: string
  subject: string
  preview: string
  cta: string
  explanation: string
  suspiciousSigns: string[]
}

interface ClassificationCard {
  kind: 'email' | 'chat' | 'notice'
  from: string
  subject: string
  preview: string
  cta: string
  answer: 'Безопасно' | 'Подозрительно' | 'Точно фишинг'
  explanation: string
  evidence: string[]
}

interface SpotResult {
  title: string
  text: string
  points: number
  tone: 'success' | 'error'
  matched: string[]
  missed: string[]
}

interface ClassificationResult {
  correct: boolean
  title: string
  text: string
  points: number
}

const signOptions: SignOption[] = [
  { id: 'weird-sender', label: 'Странный адрес отправителя' },
  { id: 'typos', label: 'Ошибки и неестественная формулировка' },
  { id: 'urgency', label: 'Давление срочностью' },
  { id: 'password-request', label: 'Просьба ввести пароль или код' },
  { id: 'suspicious-link', label: 'Подозрительная ссылка или кнопка' },
  { id: 'benefit', label: 'Обещание выгоды или выигрыша' },
  { id: 'unexpected-attachment', label: 'Неожиданное вложение' },
  { id: 'domain-mismatch', label: 'Имя компании не совпадает с доменом' },
]

const signLabelMap = new Map(signOptions.map((item) => [item.id, item.label]))

const spotCards: SpotCard[] = [
  {
    kind: 'email',
    from: 'Служба безопасности банка <secure@bank-check.help>',
    subject: 'Срочно подтвердите аккаунт',
    preview:
      'Мы временно ограничили операции. Перейдите по ссылке и введите пароль, иначе доступ будет закрыт сегодня.',
    cta: 'Подтвердить доступ',
    explanation:
      'Типичный фишинг под банк: внешний домен, давление сроком и просьба ввести пароль через кнопку.',
    suspiciousSigns: ['weird-sender', 'urgency', 'password-request', 'suspicious-link', 'domain-mismatch'],
  },
  {
    kind: 'chat',
    from: 'HR бот',
    subject: 'Подарочный сертификат',
    preview:
      'Поздравляем! Вы выиграли сертификат на 10 000 ₽. Откройте вложение prize.zip и подтвердите данные сегодня.',
    cta: 'Открыть prize.zip',
    explanation:
      'Комбинация обещания выгоды и архива от неизвестного отправителя выглядит крайне подозрительно.',
    suspiciousSigns: ['benefit', 'unexpected-attachment', 'urgency'],
  },
  {
    kind: 'notice',
    from: 'CloudBox уведомление',
    subject: 'Ваш файл недоступен',
    preview:
      'Войдите снова по ссылке cloudbox-login.support, чтобы восстановить доступ. Мы обнаружили подозрительную активность.',
    cta: 'Войти в CloudBox',
    explanation:
      'Название сервиса не совпадает с доменом, ссылка маскируется под поддержку и подталкивает к авторизации.',
    suspiciousSigns: ['suspicious-link', 'domain-mismatch', 'urgency'],
  },
]

const classificationCards: ClassificationCard[] = [
  {
    kind: 'email',
    from: 'it-support@company.ru',
    subject: 'Запланированная замена пароля',
    preview:
      'Напоминаем: смена пароля проходит только через внутренний портал portal.company.ru без запросов кода в письме.',
    cta: 'Открыть инструкцию',
    answer: 'Безопасно',
    explanation:
      'Письмо соответствует внутреннему процессу, использует корпоративный домен и не просит вводить секретные данные.',
    evidence: ['Корпоративный домен', 'Понятный регламент', 'Нет запроса пароля'],
  },
  {
    kind: 'chat',
    from: 'Коллега Алексей',
    subject: 'Нужен документ',
    preview:
      'Привет, срочно скинь файл по этой короткой ссылке, у меня телефон не открывает внутренний диск.',
    cta: 'bit.ly/3Qx9',
    answer: 'Подозрительно',
    explanation:
      'Сообщение не обязательно фишинг, но короткая ссылка и срочность требуют проверки через другой канал.',
    evidence: ['Срочность', 'Короткая ссылка', 'Нестандартный запрос'],
  },
  {
    kind: 'notice',
    from: 'SuperPrize promo',
    subject: 'Вы выиграли смартфон',
    preview:
      'Для получения приза укажите номер карты и код подтверждения. Акция заканчивается через 30 минут.',
    cta: 'Забрать приз',
    answer: 'Точно фишинг',
    explanation:
      'Запрос финансовых данных под видом выигрыша и ограничение по времени почти всегда указывают на мошенничество.',
    evidence: ['Обещание выгоды', 'Запрос секретных данных', 'Давление сроком'],
  },
  {
    kind: 'email',
    from: 'noreply@docs.company.ru',
    subject: 'Доступ к документу',
    preview:
      'Вас добавили в общий документ. Проверьте, ожидали ли вы приглашение, прежде чем открывать его.',
    cta: 'Открыть документ',
    answer: 'Подозрительно',
    explanation:
      'Корпоративный домен сам по себе не гарантирует безопасность: неожиданный доступ к документу лучше перепроверить.',
    evidence: ['Неожиданное действие', 'Нужна проверка контекста'],
  },
  {
    kind: 'chat',
    from: 'Банк OnePay',
    subject: 'Подтверждение операции',
    preview:
      'Если это не вы, срочно пройдите по ссылке onepay-protect.app и введите код из SMS для отмены операции.',
    cta: 'Отменить операцию',
    answer: 'Точно фишинг',
    explanation:
      'Банки не просят вводить SMS-код в стороннюю форму. Ссылка на внешний домен и давление сроком усиливают риск.',
    evidence: ['Внешний домен', 'Запрос кода', 'Давление сроком'],
  },
  {
    kind: 'notice',
    from: 'Campus app',
    subject: 'Двухфакторная аутентификация включена',
    preview:
      'Это сервисное уведомление: кодов и паролей вводить не нужно. Рекомендуем проверить, что действие выполняли именно вы.',
    cta: 'Проверить настройки',
    answer: 'Безопасно',
    explanation:
      'Обычное уведомление без попытки выманить секреты. При этом оно напоминает перепроверить контекст самостоятельно.',
    evidence: ['Нет запроса секретных данных', 'Нет внешней ссылки'],
  },
]

function recordMisses(current: Record<string, number>, signs: string[]) {
  return signs.reduce<Record<string, number>>((accumulator, sign) => {
    accumulator[sign] = (accumulator[sign] ?? 0) + 1
    return accumulator
  }, { ...current })
}

function messageIcon(kind: SpotCard['kind'] | ClassificationCard['kind']) {
  if (kind === 'chat') {
    return <MessageSquareText size={18} />
  }

  if (kind === 'notice') {
    return <ShieldAlert size={18} />
  }

  return <Mail size={18} />
}

export function PhishingLab({ bestScore, overallProgress, onComplete }: PhishingLabProps) {
  const [screen, setScreen] = useState<'start' | 'spot' | 'classify' | 'final'>('start')
  const [spotIndex, setSpotIndex] = useState(0)
  const [selectedSigns, setSelectedSigns] = useState<string[]>([])
  const [spotResult, setSpotResult] = useState<SpotResult | null>(null)
  const [classificationIndex, setClassificationIndex] = useState(0)
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [missedSigns, setMissedSigns] = useState<Record<string, number>>({})
  const submittedRef = useRef(false)

  const currentSpotCard = spotCards[spotIndex]
  const currentClassificationCard = classificationCards[classificationIndex]
  const totalSteps = spotCards.length + classificationCards.length
  const currentStep =
    screen === 'spot'
      ? spotIndex + 1
      : screen === 'classify'
        ? spotCards.length + classificationIndex + 1
        : totalSteps

  const resetGame = () => {
    submittedRef.current = false
    setScreen('start')
    setSpotIndex(0)
    setSelectedSigns([])
    setSpotResult(null)
    setClassificationIndex(0)
    setClassificationResult(null)
    setScore(0)
    setStreak(0)
    setCorrectAnswers(0)
    setMissedSigns({})
  }

  const startGame = () => {
    submittedRef.current = false
    setScreen('spot')
    setSpotIndex(0)
    setSelectedSigns([])
    setSpotResult(null)
    setClassificationIndex(0)
    setClassificationResult(null)
    setScore(0)
    setStreak(0)
    setCorrectAnswers(0)
    setMissedSigns({})
  }

  const toggleSign = (sign: string) => {
    if (spotResult) {
      return
    }

    setSelectedSigns((current) =>
      current.includes(sign) ? current.filter((item) => item !== sign) : [...current, sign],
    )
  }

  const handleSpotCheck = () => {
    if (spotResult || selectedSigns.length === 0) {
      return
    }

    const matched = currentSpotCard.suspiciousSigns.filter((sign) => selectedSigns.includes(sign))
    const missed = currentSpotCard.suspiciousSigns.filter((sign) => !selectedSigns.includes(sign))
    const falsePositiveCount = selectedSigns.filter(
      (sign) => !currentSpotCard.suspiciousSigns.includes(sign),
    ).length
    const perfect = missed.length === 0 && falsePositiveCount === 0
    const points = Math.max(18, matched.length * 22 - falsePositiveCount * 8 + (perfect ? 26 : 0))

    setScore((current) => current + points)
    setSpotResult({
      title: perfect ? 'Все ключевые признаки найдены' : 'Есть пропущенные сигналы',
      text: currentSpotCard.explanation,
      points,
      tone: perfect ? 'success' : 'error',
      matched,
      missed,
    })

    if (perfect) {
      setCorrectAnswers((current) => current + 1)
      setStreak((current) => current + 1)
      return
    }

    setStreak(0)
    setMissedSigns((current) => recordMisses(current, missed))
  }

  const handleSpotNext = () => {
    if (!spotResult) {
      return
    }

    if (spotIndex === spotCards.length - 1) {
      setScreen('classify')
      setSelectedSigns([])
      setSpotResult(null)
      return
    }

    setSpotIndex((current) => current + 1)
    setSelectedSigns([])
    setSpotResult(null)
  }

  const handleClassification = (choice: ClassificationCard['answer']) => {
    if (classificationResult) {
      return
    }

    const correct = choice === currentClassificationCard.answer
    const points = correct ? 80 + Math.min(streak, 3) * 10 : 22

    setScore((current) => current + points)
    setClassificationResult({
      correct,
      title: correct ? 'Решение точное' : 'Решение стоит перепроверить',
      text: currentClassificationCard.explanation,
      points,
    })

    if (correct) {
      setCorrectAnswers((current) => current + 1)
      setStreak((current) => current + 1)
      return
    }

    setStreak(0)
    setMissedSigns((current) => recordMisses(current, currentClassificationCard.evidence))
  }

  const finishGame = () => {
    if (!submittedRef.current) {
      submittedRef.current = true
      const finalScore = clampScore(score)
      const rank = getAwarenessRank(finalScore)

      onComplete({
        score: finalScore,
        label: `${rank.title} · ${finalScore} очков`,
        summary: `Точных решений: ${correctAnswers}/${totalSteps}. Часто пропускались: ${
          Object.keys(missedSigns).length ? 'некоторые сигналы' : 'критичных пропусков нет'
        }.`,
      })
    }

    setScreen('final')
  }

  const handleClassificationNext = () => {
    if (!classificationResult) {
      return
    }

    if (classificationIndex === classificationCards.length - 1) {
      finishGame()
      return
    }

    setClassificationIndex((current) => current + 1)
    setClassificationResult(null)
  }

  const finalScore = clampScore(score)
  const rank = getAwarenessRank(finalScore)
  const missedSummary = Object.entries(missedSigns)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)

  return (
    <section
      className={`academy-game ${spotResult?.tone === 'success' || classificationResult?.correct ? 'academy-game--success' : ''} ${
        spotResult?.tone === 'error' || (classificationResult && !classificationResult.correct)
          ? 'academy-game--error'
          : ''
      }`}
    >
      <div className="academy-game__hero">
        <div>
          <span className="eyebrow">Мини-игра 2</span>
          <h3>Распознавание фишинга</h3>
          <p>
            Ищите подозрительные признаки в письмах и сообщениях, затем классифицируйте карточки по
            уровню риска.
          </p>
        </div>
        <div className="academy-game__hero-metrics">
          <div className="academy-game__metric">
            <strong>{score}</strong>
            <span>очки</span>
          </div>
          <div className="academy-game__metric">
            <strong>{bestScore ?? 'нет'}</strong>
            <span>лучший результат</span>
          </div>
          <div className="academy-game__metric">
            <strong>{formatAwarenessProgress(overallProgress.completed, overallProgress.total)}</strong>
            <span>общий прогресс</span>
          </div>
        </div>
      </div>

      {screen === 'start' ? (
        <div className="academy-screen academy-screen--start">
          <div className="academy-screen__intro">
            <span className="academy-badge academy-badge--neutral">Цель</span>
            <h4>Научиться видеть фишинг до клика</h4>
            <p>
              Часть примеров будет очевидной, часть пограничной. Задача не угадывать, а замечать
              конкретные сигналы риска.
            </p>
          </div>
          <div className="academy-grid academy-grid--two">
            <article className="academy-card">
              <TriangleAlert size={18} />
              <h5>1. Найди признаки</h5>
              <p>Отмечайте подозрительные элементы в карточке сообщения.</p>
            </article>
            <article className="academy-card">
              <CheckCircle2 size={18} />
              <h5>2. Классификация</h5>
              <p>Выбирайте: безопасно, подозрительно или точно фишинг.</p>
            </article>
          </div>
          <div className="academy-screen__actions">
            <button type="button" className="button button--primary" onClick={startGame}>
              Начать игру
            </button>
            <Link to="/tests" className="button button--ghost">
              Вернуться в меню
            </Link>
          </div>
        </div>
      ) : null}

      {screen !== 'start' ? (
        <div className="academy-progress">
          <div className="academy-progress__meta">
            <span>
              Шаг {currentStep}/{totalSteps}
            </span>
            <span>Счёт: {correctAnswers} верных</span>
          </div>
          <div className="progress">
            <span style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
          </div>
        </div>
      ) : null}

      {screen === 'spot' ? (
        <div className="academy-screen">
          <div className="academy-screen__header">
            <div>
              <span className="academy-badge">Найди признаки фишинга</span>
              <h4>Карточка {spotIndex + 1}</h4>
              <p>Выберите все признаки, которые выглядят подозрительно.</p>
            </div>
            <div className="academy-tip">
              <strong>Подсказка</strong>
              <span>Особенно внимательно смотрите на домен, просьбы ввести код и искусственную срочность.</span>
            </div>
          </div>

          <div className="academy-grid academy-grid--main">
            <article className={`academy-message academy-message--${currentSpotCard.kind}`}>
              <div className="academy-message__header">
                <span>{messageIcon(currentSpotCard.kind)}</span>
                <div>
                  <strong>{currentSpotCard.subject}</strong>
                  <small>{currentSpotCard.from}</small>
                </div>
              </div>
              <p>{currentSpotCard.preview}</p>
              <button type="button" className="academy-message__cta" disabled>
                {currentSpotCard.cta}
              </button>
            </article>

            <article className="academy-card academy-card--surface">
              <div className="academy-choice-grid">
                {signOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`academy-choice academy-choice--multiselect ${
                      selectedSigns.includes(option.id) ? 'academy-choice--selected' : ''
                    }`}
                    onClick={() => toggleSign(option.id)}
                    disabled={Boolean(spotResult)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {spotResult ? (
                <div className={`academy-feedback academy-feedback--${spotResult.tone}`}>
                  <strong>{spotResult.title}</strong>
                  <p>{spotResult.text}</p>
                  <span>+{spotResult.points} очков</span>
                  <ul className="academy-bullets">
                    {spotResult.matched.map((sign) => (
                      <li key={sign}>Найдено: {signLabelMap.get(sign)}</li>
                    ))}
                    {spotResult.missed.map((sign) => (
                      <li key={sign}>Пропущено: {signLabelMap.get(sign)}</li>
                    ))}
                  </ul>
                  <button type="button" className="button button--primary" onClick={handleSpotNext}>
                    {spotIndex === spotCards.length - 1 ? 'К классификации' : 'Следующая карточка'}
                  </button>
                </div>
              ) : (
                <div className="academy-feedback academy-feedback--neutral">
                  <strong>Перед проверкой</strong>
                  <p>Выберите хотя бы один признак. После ответа система объяснит, почему решение верное или нет.</p>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleSpotCheck}
                    disabled={selectedSigns.length === 0}
                  >
                    Проверить
                  </button>
                </div>
              )}
            </article>
          </div>
        </div>
      ) : null}

      {screen === 'classify' ? (
        <div className="academy-screen">
          <div className="academy-screen__header">
            <div>
              <span className="academy-badge">Классификация</span>
              <h4>Сообщение {classificationIndex + 1}</h4>
              <p>Оцените карточку: безопасно, подозрительно или точно фишинг.</p>
            </div>
            <div className="academy-tip">
              <strong>Подсказка</strong>
              <span>Пограничные кейсы не требуют паники, но требуют перепроверки источника и контекста.</span>
            </div>
          </div>

          <div className="academy-grid academy-grid--main">
            <article className={`academy-message academy-message--${currentClassificationCard.kind}`}>
              <div className="academy-message__header">
                <span>{messageIcon(currentClassificationCard.kind)}</span>
                <div>
                  <strong>{currentClassificationCard.subject}</strong>
                  <small>{currentClassificationCard.from}</small>
                </div>
              </div>
              <p>{currentClassificationCard.preview}</p>
              <button type="button" className="academy-message__cta" disabled>
                {currentClassificationCard.cta}
              </button>
            </article>

            <article className="academy-card academy-card--surface">
              <div className="academy-choice-group academy-choice-group--stacked">
                {(['Безопасно', 'Подозрительно', 'Точно фишинг'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`academy-choice ${
                      classificationResult && option === currentClassificationCard.answer
                        ? 'academy-choice--correct'
                        : ''
                    }`}
                    onClick={() => handleClassification(option)}
                    disabled={Boolean(classificationResult)}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {classificationResult ? (
                <div
                  className={`academy-feedback academy-feedback--${
                    classificationResult.correct ? 'success' : 'error'
                  }`}
                >
                  <strong>{classificationResult.title}</strong>
                  <p>{classificationResult.text}</p>
                  <span>+{classificationResult.points} очков</span>
                  <ul className="academy-bullets">
                    {currentClassificationCard.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <button type="button" className="button button--primary" onClick={handleClassificationNext}>
                    {classificationIndex === classificationCards.length - 1 ? 'Финальный экран' : 'Следующее сообщение'}
                  </button>
                </div>
              ) : (
                <div className="academy-feedback academy-feedback--neutral">
                  <strong>На что смотреть</strong>
                  <p>
                    Если сообщение зовёт срочно кликнуть, ввести пароль или обещает выгоду, риск
                    резко растёт.
                  </p>
                </div>
              )}
            </article>
          </div>
        </div>
      ) : null}

      {screen === 'final' ? (
        <div className="academy-screen academy-screen--final">
          <div className="academy-screen__intro">
            <span className="academy-badge academy-badge--success">{rank.badge}</span>
            <h4>{rank.title}</h4>
            <p>{rank.summary}</p>
          </div>
          <div className="academy-grid academy-grid--two">
            <article className="academy-card">
              <strong>{finalScore}</strong>
              <span>итоговый балл</span>
              <small>
                Правильно распознано: {correctAnswers}/{totalSteps}
              </small>
            </article>
            <article className="academy-card">
              <strong>Что чаще всего ускользало</strong>
              {missedSummary.length ? (
                <ul className="academy-bullets">
                  {missedSummary.map(([sign, count]) => (
                    <li key={sign}>
                      {sign}: {count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Критичных пропусков не было: вы стабильно замечали ключевые признаки фишинга.</p>
              )}
            </article>
          </div>
          <div className="academy-feedback academy-feedback--neutral">
            <strong>Образовательный вывод</strong>
            <p>
              Фишинг почти всегда пытается ускорить решение пользователя: заставить срочно кликнуть,
              авторизоваться или передать код. Пауза на проверку контекста ломает эту механику.
            </p>
          </div>
          <div className="academy-screen__actions">
            <button type="button" className="button button--primary" onClick={resetGame}>
              Пройти снова
            </button>
            <Link to="/tests" className="button button--ghost">
              Вернуться в меню
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  )
}
