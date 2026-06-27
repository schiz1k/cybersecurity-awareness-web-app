import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useContentState } from '../hooks/useContentState'
import { useLeaderboardState } from '../hooks/useLeaderboardState'
import { usePlatformState } from '../hooks/usePlatformState'
import { formatScore, getAverageScore, getBestAttempt, getRecommendedTests } from '../utils/platform'

const cardMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const learningFlow = [
  {
    icon: ShieldCheck,
    title: 'Диагностика навыков',
    text: 'Короткие сценарии показывают, где пользователь уверенно распознаёт угрозы, а где нужна практика.',
  },
  {
    icon: BrainCircuit,
    title: 'Тренировки без лекций',
    text: 'Фишинг, приватность, пароли и incident response отрабатываются через интерактивные задания.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Прогресс и рейтинг',
    text: 'Результаты, серии и лучшие баллы собираются в понятную картину роста команды.',
  },
]

export function HomePage() {
  const { tests, materials } = useContentState()
  const { leaderboard } = useLeaderboardState()
  const { state } = usePlatformState()
  const playableTests = tests.filter((test) => test.status === 'playable')
  const recommended = getRecommendedTests(tests, state.attempts).slice(0, 3)
  const spotlightTests = recommended.length ? recommended : playableTests.slice(0, 3)
  const averageScore = getAverageScore(state.attempts)
  const topLeaders = leaderboard.slice(0, 5)

  return (
    <div className="page home-page">
      <motion.section
        className="home-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="home-hero__content">
          <span className="eyebrow">Просветительская платформа по кибербезопасности</span>
          <h1>Тренируйте кибергигиену через практику, рейтинг и понятный прогресс.</h1>
          <p>
            Cyber Arena объединяет короткие тренажёры, материалы и таблицу лидеров, чтобы обучение
            безопасности стало регулярной привычкой, а не разовой презентацией.
          </p>
          <div className="home-hero__actions">
            <Link to="/tests" className="button button--primary">
              Запустить тренировку
              <Zap size={17} />
            </Link>
            <Link to="/materials" className="button button--ghost">
              Изучить материалы
              <BookOpenText size={17} />
            </Link>
          </div>
          <div className="home-hero__metrics" aria-label="Ключевые показатели платформы">
            <div>
              <strong>{playableTests.length}</strong>
              <span>активных тренажёров</span>
            </div>
            <div>
              <strong>{materials.length}</strong>
              <span>материалов в базе</span>
            </div>
            <div>
              <strong>{state.attempts.length || '24/7'}</strong>
              <span>{state.attempts.length ? 'личных запусков' : 'доступ к практике'}</span>
            </div>
          </div>
        </div>

        <div className="home-hero__visual" aria-hidden="true">
          <motion.div
            className="hero-logo-scene"
            initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
          >
            <span className="hero-grid-lines" />
            <span className="hero-orbit hero-orbit--one" />
            <span className="hero-orbit hero-orbit--two" />
            <span className="hero-orbit hero-orbit--three" />
            <motion.div
              className="hero-core"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldCheck size={76} strokeWidth={1.8} />
              <strong>Cyber Arena</strong>
              <span>Security awareness</span>
            </motion.div>
            <div className="hero-node hero-node--lock">
              <LockKeyhole size={17} />
              <span>2FA</span>
            </div>
            <div className="hero-node hero-node--quiz">
              <BrainCircuit size={17} />
              <span>Quiz</span>
            </div>
            <div className="hero-node hero-node--rank">
              <Trophy size={17} />
              <span>Top</span>
            </div>
            <div className="hero-node hero-node--speed">
              <Zap size={17} />
              <span>Reflex</span>
            </div>
          </motion.div>
          <motion.div
            className="hero-float hero-float--score"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <span>Средний score</span>
            <strong>{averageScore ? formatScore(averageScore) : '850'}</strong>
          </motion.div>
          <motion.div
            className="hero-float hero-float--training"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
          >
            <Clock3 size={17} />
            <span>Фишинг-Рефлекс · 3-4 минуты</span>
          </motion.div>
          <motion.div
            className="hero-float hero-float--rank"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.45 }}
          >
            <Trophy size={17} />
            <span>Рейтинг потока обновляется после тренировок</span>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="home-section home-value-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        transition={{ staggerChildren: 0.08 }}
      >
        {[
          {
            icon: Zap,
            title: 'Тесты и мини-игры',
            text: 'Практические задания для распознавания фишинга, безопасных паролей и приватности.',
            to: '/tests',
          },
          {
            icon: Trophy,
            title: 'Рейтинги',
            text: 'Соревновательный формат помогает поддерживать темп обучения внутри команды.',
            to: '/leaderboard',
          },
          {
            icon: BookOpenText,
            title: 'Материалы',
            text: 'Плейбуки и чек-листы закрывают теорию перед тренировками и после разбора ошибок.',
            to: '/materials',
          },
          {
            icon: GraduationCap,
            title: 'Профиль развития',
            text: 'История попыток, средний score и рекомендации показывают следующий шаг.',
            to: '/profile',
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <motion.article key={item.title} className="home-value-card" variants={cardMotion}>
              <span>
                <Icon size={22} />
              </span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <Link to={item.to}>
                Перейти
                <ArrowRight size={15} />
              </Link>
            </motion.article>
          )
        })}
      </motion.section>

      <section className="home-section home-split">
        <motion.div
          className="home-section__intro"
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45 }}
        >
          <span className="eyebrow">Старт обучения</span>
          <h2>Рекомендуемые тренировки</h2>
          <p>
            Главная сразу ведёт к практике: пользователь видит актуальные сценарии, длительность и
            лучший результат, если уже проходил тренировку.
          </p>
          <Link to="/tests" className="button button--primary">
            Все тренировки
            <ArrowRight size={17} />
          </Link>
        </motion.div>

        <motion.div
          className="home-training-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {spotlightTests.map((test) => {
            const bestAttempt = getBestAttempt(test.slug, state.attempts)

            return (
              <motion.article key={test.slug} className="home-training-card" variants={cardMotion}>
                <div className="home-training-card__top">
                  <span style={{ color: test.accent }}>
                    <LockKeyhole size={20} />
                  </span>
                  <small>{test.duration}</small>
                </div>
                <h3>{test.title}</h3>
                <p>{test.description}</p>
                <div className="home-training-card__meta">
                  <span>{test.difficulty}</span>
                  <span>{bestAttempt ? formatScore(bestAttempt.score) : 'новый запуск'}</span>
                </div>
                <Link to={`/tests/${test.slug}`} className="button button--primary">
                  Начать
                </Link>
              </motion.article>
            )
          })}
        </motion.div>
      </section>

      <motion.section
        className="home-section home-flow"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        transition={{ staggerChildren: 0.12 }}
      >
        <div className="home-section__heading">
          <span className="eyebrow">Как работает Cyber Arena</span>
          <h2>От первого упражнения до устойчивой привычки</h2>
        </div>
        <div className="home-flow__grid">
          {learningFlow.map((step, index) => {
            const Icon = step.icon

            return (
              <motion.article key={step.title} className="home-flow-card" variants={cardMotion}>
                <span className="home-flow-card__index">0{index + 1}</span>
                <Icon size={24} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.article>
            )
          })}
        </div>
      </motion.section>

      <section className="home-section home-dashboard">
        <motion.article
          className="home-leaders-panel"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
        >
          <div className="home-panel-heading">
            <div>
              <span className="eyebrow">Рейтинг</span>
              <h2>Лидеры текущего потока</h2>
            </div>
            <Link to="/leaderboard" className="inline-link">
              Весь рейтинг <ArrowRight size={15} />
            </Link>
          </div>
          <div className="home-leader-list">
            {topLeaders.map((entry, index) => (
              <div key={`${entry.name}-${entry.track}`}>
                <span>#{index + 1}</span>
                <strong>{entry.name}</strong>
                <small>{entry.track}</small>
                <b>{entry.score}</b>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          className="home-about-panel"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <span className="eyebrow">О приложении</span>
          <h2>Платформа для awareness-программ, онбординга и командных тренировок.</h2>
          <p>
            Система подходит для регулярных коротких занятий: сотрудники проходят задания,
            возвращаются к материалам и видят свой прогресс в профиле.
          </p>
          <div className="home-about-panel__checks">
            <span>
              <CheckCircle2 size={17} /> Практика вместо длинных лекций
            </span>
            <span>
              <CheckCircle2 size={17} /> Быстрая обратная связь после попыток
            </span>
            <span>
              <CheckCircle2 size={17} /> Единый цикл: материал, тест, результат
            </span>
          </div>
          <div className="home-about-panel__actions">
            <Link to="/materials" className="button button--ghost">
              База знаний
            </Link>
            <Link to="/profile" className="button button--primary">
              Мой прогресс
            </Link>
          </div>
        </motion.article>
      </section>

      <motion.section
        className="home-section home-final-cta"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45 }}
      >
        <Sparkles size={24} />
        <h2>Начните с короткой тренировки и закрепите результат материалом.</h2>
        <div>
          <Link to="/tests/phishing-reflex" className="button button--primary">
            Фишинг-Рефлекс
          </Link>
          <Link to="/leaderboard" className="button button--ghost">
            Посмотреть рейтинг
          </Link>
        </div>
      </motion.section>
    </div>
  )
}
