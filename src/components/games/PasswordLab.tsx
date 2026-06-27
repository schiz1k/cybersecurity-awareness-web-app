import { CheckCircle2, RotateCcw, ShieldCheck, Sparkles, TriangleAlert, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AttemptPayload } from '../../types'
import {
  clampScore,
  formatAwarenessProgress,
  getAwarenessRank,
} from './awarenessGameUtils'

interface PasswordLabProps {
  bestScore?: number
  overallProgress: {
    completed: number
    total: number
  }
  onComplete: (payload: AttemptPayload) => void
}

interface BuilderRound {
  title: string
  scenario: string
  tip: string
  forbiddenTokens: string[]
  blocks: string[]
}

interface RatingRound {
  password: string
  strength: 'Слабый' | 'Средний' | 'Сильный'
  explanation: string
  missing: string[]
}

interface PasswordCriterion {
  label: string
  passed: boolean
}

interface PasswordAnalysis {
  criteria: PasswordCriterion[]
  fulfilled: number
  strength: 'Слабый' | 'Средний' | 'Сильный'
  percent: number
  summary: string
}

interface BuilderResult {
  title: string
  tone: 'success' | 'error'
  text: string
  points: number
}

interface RatingResult {
  correct: boolean
  title: string
  text: string
  points: number
}

const builderRounds: BuilderRound[] = [
  {
    title: 'Учебный портал',
    scenario:
      'Соберите пароль для учебного аккаунта. В примере нельзя использовать имя Ника, город Самара и год рождения 2008.',
    tip: 'Комбинируйте короткое слово, регистр, цифры и спецсимволы. Личные данные и шаблоны сразу ослабляют пароль.',
    forbiddenTokens: ['nika', 'nikita', 'samara', '2008'],
    blocks: ['Vault', 'shield', 'Q', '7', '!', 'Nova', 'x', '42', '#', 'Samara', '2008'],
  },
  {
    title: 'Игровой сервис',
    scenario:
      'Пароль для игрового профиля должен быть длинным и непредсказуемым. Не используйте admin, qwerty и любимую команду Storm.',
    tip: 'Если в пароле угадывается популярное слово или клавиатурный шаблон, его подбирают намного быстрее.',
    forbiddenTokens: ['storm', 'admin', 'qwerty'],
    blocks: ['Matrix', 'fox', 'R', '9', '%', 'pulse', 'L', '17', '&', 'admin', 'Storm'],
  },
  {
    title: 'Облачное хранилище',
    scenario:
      'Соберите пароль для облачного диска. Не включайте фамилию Ivanov, дату 0505 и шаблон password.',
    tip: 'Для облака особенно важны длина и отсутствие повторяемых паттернов, потому что такой пароль часто защищает много данных.',
    forbiddenTokens: ['ivanov', '0505', 'password'],
    blocks: ['Orbit', 'lane', 'M', '5', '?', 'delta', 'K', '88', '@', 'password', 'Ivanov'],
  },
]

const ratingRounds: RatingRound[] = [
  {
    password: 'qwerty123',
    strength: 'Слабый',
    explanation:
      'Клавиатурный шаблон и короткая длина делают пароль предсказуемым даже при наличии цифр.',
    missing: ['Длина меньше 12 символов', 'Нет заглавных букв', 'Нет спецсимволов'],
  },
  {
    password: 'Summer2024',
    strength: 'Средний',
    explanation:
      'Есть регистр и цифры, но пароль короткий и основан на обычном слове, которое часто встречается в словарях.',
    missing: ['Длина меньше 12 символов', 'Нет спецсимволов'],
  },
  {
    password: 'Starlight!27',
    strength: 'Сильный',
    explanation:
      'Пароль достаточно длинный, сочетает регистр, цифры и спецсимвол, без явных шаблонов и персональных данных.',
    missing: [],
  },
  {
    password: 'Admin!2025',
    strength: 'Слабый',
    explanation:
      'Даже со спецсимволом пароль остаётся слабым: слово admin слишком очевидное и используется в атаках перебора.',
    missing: ['Длина меньше 12 символов', 'Есть очевидный шаблон admin'],
  },
  {
    password: 'CloudRiver88',
    strength: 'Средний',
    explanation:
      'Длина уже неплохая и есть разные типы символов, но отсутствие спецсимвола делает пароль менее устойчивым.',
    missing: ['Нет спецсимволов'],
  },
  {
    password: 'R!verPulse2048',
    strength: 'Сильный',
    explanation:
      'Комбинация длины, регистра, цифр и спецсимволов без популярных словарных шаблонов даёт высокий запас прочности.',
    missing: [],
  },
]

const weakPatterns = ['123456', 'qwerty', 'password', 'admin']

function analyzePassword(password: string, forbiddenTokens: string[]): PasswordAnalysis {
  const normalized = password.toLowerCase()
  const hasLowercase = /[a-zа-яё]/.test(password)
  const hasUppercase = /[A-ZА-ЯЁ]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[^0-9A-Za-zА-Яа-яЁё]/.test(password)
  const longEnough = password.length >= 12
  const hasWeakPattern = weakPatterns.some((pattern) => normalized.includes(pattern))
  const hasPersonalData = forbiddenTokens.some((token) => normalized.includes(token.toLowerCase()))

  const criteria: PasswordCriterion[] = [
    { label: 'Не менее 12 символов', passed: longEnough },
    { label: 'Есть строчные буквы', passed: hasLowercase },
    { label: 'Есть заглавные буквы', passed: hasUppercase },
    { label: 'Есть цифры', passed: hasDigit },
    { label: 'Есть спецсимволы', passed: hasSpecial },
    { label: 'Нет слабых шаблонов', passed: !hasWeakPattern },
    { label: 'Нет личных данных', passed: !hasPersonalData },
  ]

  const fulfilled = criteria.filter((criterion) => criterion.passed).length
  const percent = Math.round((fulfilled / criteria.length) * 100)

  if (fulfilled >= 7) {
    return {
      criteria,
      fulfilled,
      strength: 'Сильный',
      percent,
      summary: 'Пароль выглядит устойчивым: он длинный, разнообразный и без очевидных зацепок.',
    }
  }

  if (fulfilled >= 5) {
    return {
      criteria,
      fulfilled,
      strength: 'Средний',
      percent,
      summary: 'Основа уже неплохая, но остаются критерии, которые понижают устойчивость.',
    }
  }

  return {
    criteria,
    fulfilled,
    strength: 'Слабый',
    percent,
    summary: 'Такой пароль угадывается слишком быстро: ему не хватает длины и непредсказуемости.',
  }
}

export function PasswordLab({ bestScore, overallProgress, onComplete }: PasswordLabProps) {
  const [screen, setScreen] = useState<'start' | 'builder' | 'rating' | 'final'>('start')
  const [builderIndex, setBuilderIndex] = useState(0)
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
  const [builderResult, setBuilderResult] = useState<BuilderResult | null>(null)
  const [builderSuccesses, setBuilderSuccesses] = useState(0)
  const [ratingIndex, setRatingIndex] = useState(0)
  const [ratingResult, setRatingResult] = useState<RatingResult | null>(null)
  const [ratingCorrect, setRatingCorrect] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const submittedRef = useRef(false)

  const currentBuilderRound = builderRounds[builderIndex]
  const currentRatingRound = ratingRounds[ratingIndex]
  const currentPassword = selectedBlocks.join('')
  const liveAnalysis = analyzePassword(currentPassword, currentBuilderRound.forbiddenTokens)
  const totalSteps = builderRounds.length + ratingRounds.length
  const currentStep =
    screen === 'builder'
      ? builderIndex + 1
      : screen === 'rating'
        ? builderRounds.length + ratingIndex + 1
        : totalSteps

  const resetGame = () => {
    submittedRef.current = false
    setScreen('start')
    setBuilderIndex(0)
    setSelectedBlocks([])
    setBuilderResult(null)
    setBuilderSuccesses(0)
    setRatingIndex(0)
    setRatingResult(null)
    setRatingCorrect(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
  }

  const startGame = () => {
    submittedRef.current = false
    setScreen('builder')
    setBuilderIndex(0)
    setSelectedBlocks([])
    setBuilderResult(null)
    setBuilderSuccesses(0)
    setRatingIndex(0)
    setRatingResult(null)
    setRatingCorrect(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
  }

  const updateStreak = (nextStreak: number) => {
    setStreak(nextStreak)
    setBestStreak((current) => Math.max(current, nextStreak))
  }

  const handleBuilderCheck = () => {
    if (builderResult || currentPassword.length === 0) {
      return
    }

    const analysis = analyzePassword(currentPassword, currentBuilderRound.forbiddenTokens)
    const solved = analysis.fulfilled === analysis.criteria.length
    const streakBonus = solved ? Math.min(streak, 3) * 10 : 0
    const points = analysis.fulfilled * 18 + (solved ? 34 : 0) + streakBonus

    setScore((current) => current + points)
    setBuilderResult({
      title: solved ? 'Пароль проходит все критерии' : 'Есть уязвимые места',
      tone: solved ? 'success' : 'error',
      text: analysis.summary,
      points,
    })

    if (solved) {
      setBuilderSuccesses((current) => current + 1)
      updateStreak(streak + 1)
      return
    }

    updateStreak(0)
  }

  const handleBuilderNext = () => {
    if (!builderResult) {
      return
    }

    if (builderIndex === builderRounds.length - 1) {
      setScreen('rating')
      setSelectedBlocks([])
      setBuilderResult(null)
      return
    }

    setBuilderIndex((current) => current + 1)
    setSelectedBlocks([])
    setBuilderResult(null)
  }

  const handleRatingChoice = (choice: RatingRound['strength']) => {
    if (ratingResult) {
      return
    }

    const correct = choice === currentRatingRound.strength
    const nextStreak = correct ? streak + 1 : 0
    const points = correct ? 78 + Math.min(streak, 4) * 8 : 18

    setScore((current) => current + points)
    setRatingResult({
      correct,
      title: correct ? 'Классификация верна' : 'Классификация не совпала',
      text: currentRatingRound.explanation,
      points,
    })

    if (correct) {
      setRatingCorrect((current) => current + 1)
    }

    updateStreak(nextStreak)
  }

  const finishGame = () => {
    if (submittedRef.current) {
      setScreen('final')
      return
    }

    submittedRef.current = true
    const finalScore = clampScore(score)
    const rank = getAwarenessRank(finalScore)

    onComplete({
      score: finalScore,
      label: `${rank.title} · ${finalScore} очков`,
      summary: `Сильных конструкций: ${builderSuccesses}/${builderRounds.length}. Верная оценка: ${ratingCorrect}/${ratingRounds.length}.`,
    })
    setScreen('final')
  }

  const handleRatingNext = () => {
    if (!ratingResult) {
      return
    }

    if (ratingIndex === ratingRounds.length - 1) {
      finishGame()
      return
    }

    setRatingIndex((current) => current + 1)
    setRatingResult(null)
  }

  const finalScore = clampScore(score)
  const rank = getAwarenessRank(finalScore)

  return (
    <section
      className={`academy-game ${builderResult?.tone === 'success' || ratingResult?.correct ? 'academy-game--success' : ''} ${
        builderResult?.tone === 'error' || (ratingResult && !ratingResult.correct)
          ? 'academy-game--error'
          : ''
      }`}
    >
      <div className="academy-game__hero">
        <div>
          <span className="eyebrow">Мини-игра 1</span>
          <h3>Безопасный пароль</h3>
          <p>
            Сначала соберите устойчивый пароль из блоков, затем потренируйтесь быстро оценивать
            готовые примеры.
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
            <h4>Понять, как выглядит действительно надёжный пароль</h4>
            <p>
              Вы получите очки за выполнение критериев, бонус за серию правильных решений и итоговую
              обучающую оценку после двух механик.
            </p>
          </div>
          <div className="academy-grid academy-grid--two">
            <article className="academy-card">
              <ShieldCheck size={18} />
              <h5>1. Конструктор</h5>
              <p>Соберите пароль из слов, цифр, символов и букв в разном регистре.</p>
            </article>
            <article className="academy-card">
              <Sparkles size={18} />
              <h5>2. Оценка примеров</h5>
              <p>Определите, какие пароли слабые, средние или сильные, и почему.</p>
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
            <span>Серия: {bestStreak}</span>
          </div>
          <div className="progress">
            <span style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
          </div>
        </div>
      ) : null}

      {screen === 'builder' ? (
        <div className="academy-screen">
          <div className="academy-screen__header">
            <div>
              <span className="academy-badge">Конструктор пароля</span>
              <h4>{currentBuilderRound.title}</h4>
              <p>{currentBuilderRound.scenario}</p>
            </div>
            <div className="academy-tip">
              <strong>Подсказка</strong>
              <span>{currentBuilderRound.tip}</span>
            </div>
          </div>

          <div className="academy-grid academy-grid--main">
            <article className="academy-card academy-card--surface">
              <small>Собранный пароль</small>
              <div className="password-output">{currentPassword || 'Выберите блоки ниже'}</div>
              <div className="password-output__actions">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setSelectedBlocks([])}
                  disabled={Boolean(builderResult)}
                >
                  <RotateCcw size={16} />
                  Очистить
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleBuilderCheck}
                  disabled={Boolean(builderResult) || currentPassword.length === 0}
                >
                  Проверить
                </button>
              </div>
              <div className="password-selection">
                {selectedBlocks.map((block, index) => (
                  <button
                    key={`${block}-${index}`}
                    type="button"
                    className="password-block password-block--selected"
                    onClick={() =>
                      !builderResult &&
                      setSelectedBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    {block}
                  </button>
                ))}
              </div>
              <div className="password-pool">
                {currentBuilderRound.blocks.map((block) => (
                  <button
                    key={block}
                    type="button"
                    className={`password-block ${selectedBlocks.includes(block) ? 'password-block--used' : ''}`}
                    disabled={selectedBlocks.includes(block) || Boolean(builderResult)}
                    onClick={() => setSelectedBlocks((current) => [...current, block])}
                  >
                    {block}
                  </button>
                ))}
              </div>
            </article>

            <article className="academy-card academy-card--surface">
              <div className="academy-meter">
                <div>
                  <small>Индикатор силы</small>
                  <strong>{liveAnalysis.strength}</strong>
                </div>
                <div className="academy-meter__bar">
                  <span style={{ width: `${liveAnalysis.percent}%` }} />
                </div>
              </div>
              <ul className="academy-checklist">
                {liveAnalysis.criteria.map((criterion) => (
                  <li key={criterion.label} className={criterion.passed ? 'is-passed' : 'is-missed'}>
                    {criterion.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span>{criterion.label}</span>
                  </li>
                ))}
              </ul>
              {builderResult ? (
                <div className={`academy-feedback academy-feedback--${builderResult.tone}`}>
                  <strong>{builderResult.title}</strong>
                  <p>{builderResult.text}</p>
                  <span>+{builderResult.points} очков</span>
                  <button type="button" className="button button--primary" onClick={handleBuilderNext}>
                    {builderIndex === builderRounds.length - 1 ? 'К оценке примеров' : 'Следующий пароль'}
                  </button>
                </div>
              ) : (
                <div className="academy-feedback academy-feedback--neutral">
                  <strong>Что сейчас влияет на оценку</strong>
                  <p>{liveAnalysis.summary}</p>
                  <span>Выполнено критериев: {liveAnalysis.fulfilled}/7</span>
                </div>
              )}
            </article>
          </div>
        </div>
      ) : null}

      {screen === 'rating' ? (
        <div className="academy-screen">
          <div className="academy-screen__header">
            <div>
              <span className="academy-badge">Оценка готового пароля</span>
              <h4>Пример {ratingIndex + 1}</h4>
              <p>Определите уровень силы и сверяйтесь с критериями безопасности.</p>
            </div>
            <div className="academy-tip">
              <strong>Подсказка</strong>
              <span>Смотрите не только на длину, но и на шаблоны, регистр, цифры и спецсимволы.</span>
            </div>
          </div>

          <div className="academy-grid academy-grid--main">
            <article className="academy-card academy-card--surface academy-card--centered">
              <small>Проверяем пароль</small>
              <div className="password-sample">{currentRatingRound.password}</div>
              <div className="academy-choice-group">
                {(['Слабый', 'Средний', 'Сильный'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`academy-choice ${
                      ratingResult && option === currentRatingRound.strength
                        ? 'academy-choice--correct'
                        : ''
                    }`}
                    disabled={Boolean(ratingResult)}
                    onClick={() => handleRatingChoice(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </article>

            <article className="academy-card academy-card--surface">
              {ratingResult ? (
                <div className={`academy-feedback academy-feedback--${ratingResult.correct ? 'success' : 'error'}`}>
                  <strong>{ratingResult.title}</strong>
                  <p>{ratingResult.text}</p>
                  <span>+{ratingResult.points} очков</span>
                  {currentRatingRound.missing.length ? (
                    <ul className="academy-bullets">
                      {currentRatingRound.missing.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="academy-feedback__note">Критические недочёты не обнаружены.</p>
                  )}
                  <button type="button" className="button button--primary" onClick={handleRatingNext}>
                    {ratingIndex === ratingRounds.length - 1 ? 'Финальный экран' : 'Следующий пример'}
                  </button>
                </div>
              ) : (
                <div className="academy-feedback academy-feedback--neutral">
                  <TriangleAlert size={18} />
                  <strong>До ответа</strong>
                  <p>
                    Проверьте длину, наличие разных типов символов и подумайте, есть ли в пароле
                    предсказуемое слово.
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
                Конструктор: {builderSuccesses}/{builderRounds.length} · Оценка: {ratingCorrect}/
                {ratingRounds.length}
              </small>
            </article>
            <article className="academy-card">
              <strong>Обучающий вывод</strong>
              <p>
                Сильный пароль начинается с длины и разнообразия символов, но ломается, если в нём
                есть имя, дата рождения или шаблон вроде qwerty.
              </p>
            </article>
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
