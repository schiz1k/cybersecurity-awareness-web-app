import { LockKeyhole, SlidersHorizontal } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AttemptPayload } from '../../types'
import {
  clampScore,
  formatAwarenessProgress,
  getAwarenessRank,
} from './awarenessGameUtils'

interface PrivacyLabProps {
  bestScore?: number
  overallProgress: {
    completed: number
    total: number
  }
  onComplete: (payload: AttemptPayload) => void
}

type PrivacyGrade = 'Безопасно' | 'Допустимо' | 'Рискованно'

type SettingsState = {
  profileVisibility: string
  messages: string
  posts: string
  geolocation: string
  camera: string
  microphone: string
  contacts: string
  twoFactor: boolean
  phoneVisibility: string
  birthDateVisibility: string
}

interface MatchOption {
  label: string
  grade: PrivacyGrade
  summary: string
  best: boolean
}

interface MatchCase {
  title: string
  situation: string
  options: MatchOption[]
}

interface SettingRule {
  label: string
  recommended: string | boolean
  acceptable?: Array<string | boolean>
  safeNote: string
  acceptableNote?: string
  riskyNote: string
}

interface SimulatorScenario {
  title: string
  description: string
  rules: Record<keyof SettingsState, SettingRule>
  initial: SettingsState
}

interface MatchResult {
  title: string
  text: string
  points: number
  tone: 'success' | 'neutral' | 'error'
}

interface SimulatorCheck {
  points: number
  safeCount: number
  acceptableCount: number
  riskyCount: number
  overall: PrivacyGrade
  recommendations: string[]
  details: Array<{
    key: keyof SettingsState
    label: string
    grade: PrivacyGrade
    note: string
  }>
}

const fieldOptions: Record<Exclude<keyof SettingsState, 'twoFactor'>, string[]> = {
  profileVisibility: ['Только друзья', 'Друзья друзей', 'Все'],
  messages: ['Только друзья', 'Друзья друзей', 'Все'],
  posts: ['Только друзья', 'Подписчики', 'Все'],
  geolocation: ['Никогда', 'Только при использовании', 'Всегда'],
  camera: ['Запрещено', 'Спрашивать каждый раз', 'Разрешено всегда'],
  microphone: ['Запрещено', 'Спрашивать каждый раз', 'Разрешено всегда'],
  contacts: ['Запрещено', 'Только вручную', 'Разрешено всегда'],
  phoneVisibility: ['Никто', 'Только я', 'Друзья', 'Все'],
  birthDateVisibility: ['Никто', 'Только месяц и день', 'Полная дата'],
}

const matchCases: MatchCase[] = [
  {
    title: 'Профиль школьника в социальной сети',
    situation:
      'Аккаунт ведёт подросток. В профиле есть фото, сторис и одноклассники. Нежелательно, чтобы незнакомые люди писали напрямую.',
    options: [
      {
        label: 'Закрытый профиль, сообщения только от друзей, дата рождения скрыта',
        grade: 'Безопасно',
        summary: 'Снижает риск лишнего контакта и не раскрывает лишние данные.',
        best: true,
      },
      {
        label: 'Профиль открыт, но сторис скрыты; писать могут друзья друзей',
        grade: 'Допустимо',
        summary: 'Лучше, чем полностью открытый режим, но риск лишних контактов сохраняется.',
        best: false,
      },
      {
        label: 'Профиль открыт для всех, номер телефона виден, сообщения без ограничений',
        grade: 'Рискованно',
        summary: 'Даёт слишком много точек входа для незнакомых людей и социальной инженерии.',
        best: false,
      },
    ],
  },
  {
    title: 'Аккаунт студента с открытыми публикациями',
    situation:
      'Студенту важно показывать портфолио и проекты, но в профиле всё ещё не стоит публиковать лишние личные данные.',
    options: [
      {
        label: 'Посты открыты, но номер телефона и дата рождения скрыты, включена 2FA',
        grade: 'Безопасно',
        summary: 'Хороший баланс между публичностью и защитой чувствительных данных.',
        best: true,
      },
      {
        label: 'Посты и сторис открыты, писать могут все, телефон виден друзьям',
        grade: 'Допустимо',
        summary: 'Работать можно, но стоит ограничить входящие сообщения и скрыть телефон.',
        best: false,
      },
      {
        label: 'Посты открыты, геолокация всегда включена, контакты и камера разрешены постоянно',
        grade: 'Рискованно',
        summary: 'Публичность превращается в утечку приватной информации и избыточных разрешений.',
        best: false,
      },
    ],
  },
  {
    title: 'Игровой аккаунт',
    situation:
      'Игрок общается в чате и участвует в матчах с незнакомыми людьми. Важно сократить риск домогательств и угона аккаунта.',
    options: [
      {
        label: 'Ник публичный, но личные сообщения ограничены, 2FA включена, телефон скрыт',
        grade: 'Безопасно',
        summary: 'Публичный ник не мешает защите, если критичные настройки ограничены.',
        best: true,
      },
      {
        label: 'Сообщения от всех, 2FA выключена, номер телефона скрыт',
        grade: 'Допустимо',
        summary: 'Не катастрофа, но риск угона и спама заметно выше.',
        best: false,
      },
      {
        label: 'Профиль и контакты открыты для всех, дата рождения полная, 2FA выключена',
        grade: 'Рискованно',
        summary: 'Слишком много личных данных и почти нет барьеров от взлома.',
        best: false,
      },
    ],
  },
  {
    title: 'Мессенджер для учёбы и кружков',
    situation:
      'Нужно получать сообщения от преподавателей и новых участников группы, но без открытого доступа ко всем данным профиля.',
    options: [
      {
        label: 'Писать могут контакты и группы, фото и телефон скрыты, геолокация выключена',
        grade: 'Безопасно',
        summary: 'Сообщения по делу сохраняются, а лишняя видимость профиля отключена.',
        best: true,
      },
      {
        label: 'Писать может кто угодно, но номер телефона скрыт',
        grade: 'Допустимо',
        summary: 'Рабоче, но поток лишних сообщений и попыток манипуляции выше.',
        best: false,
      },
      {
        label: 'Открыты сообщения, номер телефона, дата рождения и синхронизация контактов без ограничений',
        grade: 'Рискованно',
        summary: 'Комбинация излишней доступности и лишних разрешений создаёт лишние риски.',
        best: false,
      },
    ],
  },
]

const simulatorScenarios: SimulatorScenario[] = [
  {
    title: 'Соцсеть школьника',
    description:
      'Соберите конфигурацию, в которой профиль не становится закрытой пустыней, но и не раздаёт личные данные всем подряд.',
    initial: {
      profileVisibility: 'Все',
      messages: 'Все',
      posts: 'Все',
      geolocation: 'Всегда',
      camera: 'Разрешено всегда',
      microphone: 'Разрешено всегда',
      contacts: 'Разрешено всегда',
      twoFactor: false,
      phoneVisibility: 'Все',
      birthDateVisibility: 'Полная дата',
    },
    rules: {
      profileVisibility: {
        label: 'Видимость профиля',
        recommended: 'Только друзья',
        acceptable: ['Друзья друзей'],
        safeNote: 'Закрытый профиль лучше всего защищает от случайных просмотров.',
        acceptableNote: 'Компромисс допустим, но круг видимости всё ещё широковат.',
        riskyNote: 'Полностью открытый профиль упрощает сбор личной информации.',
      },
      messages: {
        label: 'Кто может писать',
        recommended: 'Только друзья',
        acceptable: ['Друзья друзей'],
        safeNote: 'Личные сообщения лучше ограничить знакомыми людьми.',
        acceptableNote: 'Иногда это удобно, но спам и манипуляции становятся вероятнее.',
        riskyNote: 'Сообщения от всех создают лишний канал давления и мошенничества.',
      },
      posts: {
        label: 'Кто видит публикации',
        recommended: 'Только друзья',
        acceptable: ['Подписчики'],
        safeNote: 'Личный контент лучше держать в ограниченном круге.',
        acceptableNote: 'Подписчики допустимы, если они реально проверены.',
        riskyNote: 'Открытые посты упрощают слежение за привычками и окружением.',
      },
      geolocation: {
        label: 'Геолокация',
        recommended: 'Никогда',
        acceptable: ['Только при использовании'],
        safeNote: 'Постоянная геолокация для соцсети не нужна.',
        acceptableNote: 'Временный доступ лучше постоянного, но всё равно требует осознанности.',
        riskyNote: 'Постоянная геолокация раскрывает маршруты и привычки.',
      },
      camera: {
        label: 'Доступ к камере',
        recommended: 'Спрашивать каждый раз',
        acceptable: ['Запрещено'],
        safeNote: 'Запрос по необходимости защищает от лишних включений камеры.',
        acceptableNote: 'Полный запрет безопасен, но может мешать части функций.',
        riskyNote: 'Постоянный доступ к камере обычно избыточен.',
      },
      microphone: {
        label: 'Доступ к микрофону',
        recommended: 'Спрашивать каждый раз',
        acceptable: ['Запрещено'],
        safeNote: 'Лучше выдавать доступ только в момент использования.',
        acceptableNote: 'Полный запрет безопасен, если голосовые функции не нужны.',
        riskyNote: 'Постоянный доступ к микрофону излишен.',
      },
      contacts: {
        label: 'Доступ к контактам',
        recommended: 'Только вручную',
        acceptable: ['Запрещено'],
        safeNote: 'Ручной доступ помогает не отдавать всю адресную книгу сразу.',
        acceptableNote: 'Запрет безопасен, но часть функции поиска друзей станет ручной.',
        riskyNote: 'Полный доступ к контактам часто не нужен.',
      },
      twoFactor: {
        label: 'Двухфакторная аутентификация',
        recommended: true,
        safeNote: '2FA заметно снижает риск угона аккаунта.',
        riskyNote: 'Без 2FA аккаунт сильнее зависит только от пароля.',
      },
      phoneVisibility: {
        label: 'Отображение номера телефона',
        recommended: 'Никто',
        acceptable: ['Только я'],
        safeNote: 'Номер телефона не должен быть виден другим пользователям.',
        acceptableNote: 'Самому себе видеть номер нормально, но лучше не раскрывать его другим.',
        riskyNote: 'Видимый номер упрощает спам и социальную инженерию.',
      },
      birthDateVisibility: {
        label: 'Дата рождения',
        recommended: 'Никто',
        acceptable: ['Только месяц и день'],
        safeNote: 'Полная дата рождения не нужна внешним наблюдателям.',
        acceptableNote: 'Месяц и день ещё терпимы, но идеал — скрыть полностью.',
        riskyNote: 'Полная дата рождения часто используется в проверочных вопросах.',
      },
    },
  },
  {
    title: 'Публичный студенческий профиль',
    description:
      'Профиль должен помогать с учёбой и портфолио, но не раскрывать контакты и приватные сведения.',
    initial: {
      profileVisibility: 'Все',
      messages: 'Все',
      posts: 'Все',
      geolocation: 'Только при использовании',
      camera: 'Спрашивать каждый раз',
      microphone: 'Разрешено всегда',
      contacts: 'Разрешено всегда',
      twoFactor: false,
      phoneVisibility: 'Друзья',
      birthDateVisibility: 'Полная дата',
    },
    rules: {
      profileVisibility: {
        label: 'Видимость профиля',
        recommended: 'Все',
        acceptable: ['Друзья друзей', 'Только друзья'],
        safeNote: 'Для портфолио открытый профиль может быть оправдан.',
        acceptableNote: 'Чуть более закрытый режим тоже допустим, если публичность не критична.',
        riskyNote: 'Здесь рискованного варианта почти нет, важнее остальные поля.',
      },
      messages: {
        label: 'Кто может писать',
        recommended: 'Друзья друзей',
        acceptable: ['Только друзья'],
        safeNote: 'Так можно получать полезные контакты, не открывая вход всем подряд.',
        acceptableNote: 'Строже тоже нормально, просто потеряете часть новых входящих.',
        riskyNote: 'Сообщения от всех быстро превращаются в спам и фишинг.',
      },
      posts: {
        label: 'Кто видит публикации',
        recommended: 'Все',
        acceptable: ['Подписчики', 'Только друзья'],
        safeNote: 'Для открытого портфолио это логичный выбор.',
        acceptableNote: 'Если аудитория ограничена, подписчики тоже подходят.',
        riskyNote: 'Слишком закрытые посты в этом кейсе снижают пользу профиля.',
      },
      geolocation: {
        label: 'Геолокация',
        recommended: 'Никогда',
        acceptable: ['Только при использовании'],
        safeNote: 'Постоянная геолокация не нужна даже публичному профилю.',
        acceptableNote: 'Временный доступ допустим для отдельных функций.',
        riskyNote: 'Постоянная передача геопозиции повышает риск слежения.',
      },
      camera: {
        label: 'Доступ к камере',
        recommended: 'Спрашивать каждый раз',
        acceptable: ['Запрещено'],
        safeNote: 'Доступ лучше выдавать только в момент записи контента.',
        acceptableNote: 'Полный запрет допустим, если снимаете редко.',
        riskyNote: 'Постоянный доступ к камере не нужен.',
      },
      microphone: {
        label: 'Доступ к микрофону',
        recommended: 'Спрашивать каждый раз',
        acceptable: ['Запрещено'],
        safeNote: 'Разрешение по запросу безопаснее постоянного.',
        acceptableNote: 'Запрет безопасен, если голосовые комнаты не нужны.',
        riskyNote: 'Постоянный доступ к микрофону слишком широк.',
      },
      contacts: {
        label: 'Доступ к контактам',
        recommended: 'Только вручную',
        acceptable: ['Запрещено'],
        safeNote: 'Ручной режим даёт контроль над тем, чем вы делитесь.',
        acceptableNote: 'Запрет можно оставить, если поиск людей не нужен.',
        riskyNote: 'Постоянный доступ к адресной книге избыточен.',
      },
      twoFactor: {
        label: 'Двухфакторная аутентификация',
        recommended: true,
        safeNote: '2FA особенно важна для заметных публичных аккаунтов.',
        riskyNote: 'Публичный аккаунт без 2FA быстрее становится целью.',
      },
      phoneVisibility: {
        label: 'Отображение номера телефона',
        recommended: 'Никто',
        acceptable: ['Только я'],
        safeNote: 'Для портфолио телефон не обязан быть видимым в профиле.',
        acceptableNote: 'Самому себе видеть номер нормально.',
        riskyNote: 'Даже для друзей это лишняя поверхность атаки.',
      },
      birthDateVisibility: {
        label: 'Дата рождения',
        recommended: 'Никто',
        acceptable: ['Только месяц и день'],
        safeNote: 'Публичному профилю не нужна полная дата рождения.',
        acceptableNote: 'Частичная дата допустима, но всё же неидеальна.',
        riskyNote: 'Полная дата рождения раскрывает лишние персональные данные.',
      },
    },
  },
]

function createInitialSettings(scenario: SimulatorScenario) {
  return { ...scenario.initial }
}

function evaluateScenario(settings: SettingsState, scenario: SimulatorScenario): SimulatorCheck {
  let safeCount = 0
  let acceptableCount = 0
  let riskyCount = 0
  let points = 0
  const recommendations: string[] = []

  const details = Object.entries(scenario.rules).map(([key, rule]) => {
    const fieldKey = key as keyof SettingsState
    const value = settings[fieldKey]
    const acceptableValues = rule.acceptable ?? []
    let grade: PrivacyGrade
    let note: string

    if (value === rule.recommended) {
      grade = 'Безопасно'
      note = rule.safeNote
      safeCount += 1
      points += 18
    } else if (acceptableValues.includes(value)) {
      grade = 'Допустимо'
      note = rule.acceptableNote ?? rule.safeNote
      acceptableCount += 1
      points += 11
      recommendations.push(`Можно усилить: ${rule.label.toLowerCase()}.`)
    } else {
      grade = 'Рискованно'
      note = rule.riskyNote
      riskyCount += 1
      points += 3
      recommendations.push(`Измените настройку: ${rule.label.toLowerCase()}.`)
    }

    return {
      key: fieldKey,
      label: rule.label,
      grade,
      note,
    }
  })

  let overall: PrivacyGrade = 'Безопасно'
  if (riskyCount >= 2) {
    overall = 'Рискованно'
  } else if (acceptableCount >= 3 || riskyCount === 1) {
    overall = 'Допустимо'
  }

  return {
    points,
    safeCount,
    acceptableCount,
    riskyCount,
    overall,
    recommendations,
    details,
  }
}

export function PrivacyLab({ bestScore, overallProgress, onComplete }: PrivacyLabProps) {
  const [screen, setScreen] = useState<'start' | 'match' | 'simulator' | 'final'>('start')
  const [matchIndex, setMatchIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [simulatorIndex, setSimulatorIndex] = useState(0)
  const [settings, setSettings] = useState<SettingsState>(createInitialSettings(simulatorScenarios[0]))
  const [simulatorResult, setSimulatorResult] = useState<SimulatorCheck | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [bestChoices, setBestChoices] = useState(0)
  const submittedRef = useRef(false)

  const currentMatch = matchCases[matchIndex]
  const currentScenario = simulatorScenarios[simulatorIndex]
  const totalSteps = matchCases.length + simulatorScenarios.length
  const currentStep =
    screen === 'match'
      ? matchIndex + 1
      : screen === 'simulator'
        ? matchCases.length + simulatorIndex + 1
        : totalSteps

  const previewEvaluation = useMemo(
    () => evaluateScenario(settings, currentScenario),
    [currentScenario, settings],
  )

  const resetGame = () => {
    submittedRef.current = false
    setScreen('start')
    setMatchIndex(0)
    setSelectedOption(null)
    setMatchResult(null)
    setSimulatorIndex(0)
    setSettings(createInitialSettings(simulatorScenarios[0]))
    setSimulatorResult(null)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setBestChoices(0)
  }

  const startGame = () => {
    submittedRef.current = false
    setScreen('match')
    setMatchIndex(0)
    setSelectedOption(null)
    setMatchResult(null)
    setSimulatorIndex(0)
    setSettings(createInitialSettings(simulatorScenarios[0]))
    setSimulatorResult(null)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setBestChoices(0)
  }

  const updateStreak = (nextStreak: number) => {
    setStreak(nextStreak)
    setBestStreak((current) => Math.max(current, nextStreak))
  }

  const handleMatchCheck = () => {
    if (matchResult || selectedOption === null) {
      return
    }

    const option = currentMatch.options[selectedOption]
    const points =
      option.grade === 'Безопасно' ? 96 + Math.min(streak, 3) * 8 : option.grade === 'Допустимо' ? 52 : 18

    setScore((current) => current + points)
    setMatchResult({
      title:
        option.grade === 'Безопасно'
          ? 'Оптимальная конфигурация'
          : option.grade === 'Допустимо'
            ? 'Приемлемо, но не лучший вариант'
            : 'Конфигурация слишком открытая',
      text: option.summary,
      points,
      tone:
        option.grade === 'Безопасно'
          ? 'success'
          : option.grade === 'Допустимо'
            ? 'neutral'
            : 'error',
    })

    if (option.best) {
      setBestChoices((current) => current + 1)
      updateStreak(streak + 1)
      return
    }

    updateStreak(0)
  }

  const handleMatchNext = () => {
    if (!matchResult) {
      return
    }

    if (matchIndex === matchCases.length - 1) {
      setScreen('simulator')
      setSelectedOption(null)
      setMatchResult(null)
      setSettings(createInitialSettings(simulatorScenarios[0]))
      return
    }

    setMatchIndex((current) => current + 1)
    setSelectedOption(null)
    setMatchResult(null)
  }

  const handleSimulatorCheck = () => {
    if (simulatorResult) {
      return
    }

    const result = evaluateScenario(settings, currentScenario)
    const bonus = result.riskyCount === 0 ? 24 + Math.min(streak, 3) * 8 : 0
    setScore((current) => current + result.points + bonus)
    setSimulatorResult({ ...result, points: result.points + bonus })

    if (result.riskyCount === 0) {
      updateStreak(streak + 1)
      return
    }

    updateStreak(0)
  }

  const finishGame = () => {
    if (!submittedRef.current) {
      submittedRef.current = true
      const finalScore = clampScore(score)
      const rank = getAwarenessRank(finalScore)

      onComplete({
        score: finalScore,
        label: `${rank.title} · ${finalScore} очков`,
        summary: `Оптимальных решений: ${bestChoices}/${matchCases.length}. Лучший приватный режим: серия ${bestStreak}.`,
      })
    }

    setScreen('final')
  }

  const handleSimulatorNext = () => {
    if (!simulatorResult) {
      return
    }

    if (simulatorIndex === simulatorScenarios.length - 1) {
      finishGame()
      return
    }

    const nextIndex = simulatorIndex + 1
    setSimulatorIndex(nextIndex)
    setSettings(createInitialSettings(simulatorScenarios[nextIndex]))
    setSimulatorResult(null)
  }

  const finalScore = clampScore(score)
  const rank = getAwarenessRank(finalScore)

  return (
    <section
      className={`academy-game ${matchResult?.tone === 'success' || simulatorResult?.overall === 'Безопасно' ? 'academy-game--success' : ''} ${
        matchResult?.tone === 'error' || simulatorResult?.overall === 'Рискованно'
          ? 'academy-game--error'
          : ''
      }`}
    >
      <div className="academy-game__hero">
        <div>
          <span className="eyebrow">Мини-игра 3</span>
          <h3>Настройки приватности</h3>
          <p>
            Сначала выберите правильную конфигурацию под ситуацию, затем соберите её в симуляторе
            экрана настроек.
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
            <h4>Понять, какие настройки приватности действительно защищают</h4>
            <p>
              Здесь нет абсолютно чёрно-белых ответов: часть решений допустима, но не оптимальна.
              Игра учит видеть эту разницу.
            </p>
          </div>
          <div className="academy-grid academy-grid--two">
            <article className="academy-card">
              <SlidersHorizontal size={18} />
              <h5>1. Сопоставление ситуации</h5>
              <p>Выбирайте наиболее безопасный и разумный набор настроек.</p>
            </article>
            <article className="academy-card">
              <LockKeyhole size={18} />
              <h5>2. Симулятор</h5>
              <p>Настраивайте видимость профиля, доступы приложения и защиту аккаунта.</p>
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
            <span>Лучшая серия: {bestStreak}</span>
          </div>
          <div className="progress">
            <span style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
          </div>
        </div>
      ) : null}

      {screen === 'match' ? (
        <div className="academy-screen">
          <div className="academy-screen__header">
            <div>
              <span className="academy-badge">Сопоставление</span>
              <h4>{currentMatch.title}</h4>
              <p>{currentMatch.situation}</p>
            </div>
            <div className="academy-tip">
              <strong>Подсказка</strong>
              <span>Ищите баланс: не все публичные опции опасны, но чувствительные данные лучше скрывать почти всегда.</span>
            </div>
          </div>

          <div className="academy-choice-group academy-choice-group--stacked">
            {currentMatch.options.map((option, index) => (
              <button
                key={option.label}
                type="button"
                className={`academy-choice ${
                  selectedOption === index ? 'academy-choice--selected' : ''
                } ${matchResult && option.best ? 'academy-choice--correct' : ''}`}
                onClick={() => !matchResult && setSelectedOption(index)}
              >
                <strong>{option.label}</strong>
                <span>{option.grade}</span>
              </button>
            ))}
          </div>

          {matchResult ? (
            <div className={`academy-feedback academy-feedback--${matchResult.tone}`}>
              <strong>{matchResult.title}</strong>
              <p>{matchResult.text}</p>
              <span>+{matchResult.points} очков</span>
              <button type="button" className="button button--primary" onClick={handleMatchNext}>
                {matchIndex === matchCases.length - 1 ? 'Открыть симулятор' : 'Следующая ситуация'}
              </button>
            </div>
          ) : (
            <div className="academy-feedback academy-feedback--neutral">
              <strong>Перед проверкой</strong>
              <p>Выберите один вариант. После ответа игра объяснит, почему он безопасен, допустим или рискован.</p>
              <button
                type="button"
                className="button button--primary"
                onClick={handleMatchCheck}
                disabled={selectedOption === null}
              >
                Проверить
              </button>
            </div>
          )}
        </div>
      ) : null}

      {screen === 'simulator' ? (
        <div className="academy-screen">
          <div className="academy-screen__header">
            <div>
              <span className="academy-badge">Симулятор экрана настроек</span>
              <h4>{currentScenario.title}</h4>
              <p>{currentScenario.description}</p>
            </div>
            <div className="academy-tip">
              <strong>Подсказка</strong>
              <span>
                Если настройка не нужна постоянно, ей редко стоит давать постоянный доступ или
                широкую видимость.
              </span>
            </div>
          </div>

          <div className="academy-grid academy-grid--main">
            <article className="academy-card academy-card--surface">
              <div className="privacy-settings">
                {Object.entries(currentScenario.rules).map(([key, rule]) => {
                  const fieldKey = key as keyof SettingsState

                  if (fieldKey === 'twoFactor') {
                    return (
                      <label key={fieldKey} className="privacy-row privacy-row--toggle">
                        <div>
                          <strong>{rule.label}</strong>
                          <small>Рекомендуется: включено</small>
                        </div>
                        <button
                          type="button"
                          className={`toggle ${settings.twoFactor ? 'toggle--active' : ''}`}
                          onClick={() =>
                            !simulatorResult &&
                            setSettings((current) => ({ ...current, twoFactor: !current.twoFactor }))
                          }
                        >
                          <span />
                        </button>
                      </label>
                    )
                  }

                  return (
                    <label key={fieldKey} className="privacy-row">
                      <div>
                        <strong>{rule.label}</strong>
                        <small>Выберите уровень доступа</small>
                      </div>
                      <select
                        value={settings[fieldKey] as string}
                        disabled={Boolean(simulatorResult)}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            [fieldKey]: event.target.value,
                          }))
                        }
                      >
                        {fieldOptions[fieldKey].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                })}
              </div>

              <div className="academy-feedback academy-feedback--neutral">
                <strong>Текущий уровень приватности: {previewEvaluation.overall}</strong>
                <p>
                  Уже сейчас видно, сколько параметров безопасны: {previewEvaluation.safeCount}, допустимы:{' '}
                  {previewEvaluation.acceptableCount}, рискованны: {previewEvaluation.riskyCount}.
                </p>
              </div>
            </article>

            <article className="academy-card academy-card--surface">
              {simulatorResult ? (
                <div
                  className={`academy-feedback academy-feedback--${
                    simulatorResult.overall === 'Безопасно'
                      ? 'success'
                      : simulatorResult.overall === 'Допустимо'
                        ? 'neutral'
                        : 'error'
                  }`}
                >
                  <strong>Общий уровень: {simulatorResult.overall}</strong>
                  <p>
                    Безопасных параметров: {simulatorResult.safeCount}, допустимых:{' '}
                    {simulatorResult.acceptableCount}, рискованных: {simulatorResult.riskyCount}.
                  </p>
                  <span>+{simulatorResult.points} очков</span>
                  <ul className="academy-bullets">
                    {simulatorResult.details.map((detail) => (
                      <li key={detail.key}>
                        {detail.label}: {detail.grade}. {detail.note}
                      </li>
                    ))}
                  </ul>
                  {simulatorResult.recommendations.length ? (
                    <div className="academy-feedback__note">
                      <strong>Что стоит изменить</strong>
                      <ul className="academy-bullets">
                        {simulatorResult.recommendations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <button type="button" className="button button--primary" onClick={handleSimulatorNext}>
                    {simulatorIndex === simulatorScenarios.length - 1 ? 'Финальный экран' : 'Следующий сценарий'}
                  </button>
                </div>
              ) : (
                <div className="academy-feedback academy-feedback--neutral">
                  <strong>Проверка</strong>
                  <p>
                    Когда закончите настройку, нажмите кнопку ниже. Игра объяснит каждый параметр
                    отдельно и покажет общие рекомендации.
                  </p>
                  <button type="button" className="button button--primary" onClick={handleSimulatorCheck}>
                    Проверить
                  </button>
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
                Лучших решений: {bestChoices}/{matchCases.length}
              </small>
            </article>
            <article className="academy-card">
              <strong>Обучающий вывод</strong>
              <p>
                Приватность редко строится на одном переключателе. Важен набор настроек: меньше
                публичных данных, меньше постоянных разрешений и обязательно защита входа.
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
