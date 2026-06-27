import { startTransition, useDeferredValue, useState } from 'react'
import { Award, BookCheck, BookOpen, GraduationCap } from 'lucide-react'
import { SectionTitle } from '../components/SectionTitle'
import { TestCard } from '../components/TestCard'
import { getAwarenessProgress } from '../components/games/awarenessGameUtils'
import { useContentState } from '../hooks/useContentState'
import { usePlatformState } from '../hooks/usePlatformState'

export function TestsPage() {
  const { tests } = useContentState()
  const { state } = usePlatformState()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Все')
  const deferredQuery = useDeferredValue(query)
  const categories = ['Все', ...new Set(tests.map((test) => test.category))]
  const awarenessProgress = getAwarenessProgress(state.attempts)
  const playableTests = tests.filter((test) => test.status === 'playable')
  const completedTestSlugs = new Set(
    state.attempts
      .map((attempt) => attempt.testSlug)
      .filter((slug) => playableTests.some((test) => test.slug === slug)),
  )
  const trainingProgress = playableTests.length
    ? Math.round((completedTestSlugs.size / playableTests.length) * 100)
    : 0

  const filtered = tests.filter((test) => {
    const matchesCategory = category === 'Все' || test.category === category
    const matchesQuery =
      deferredQuery.length === 0 ||
      `${test.title} ${test.description} ${test.deck.join(' ')}`.toLowerCase().includes(deferredQuery.toLowerCase())

    return matchesCategory && matchesQuery
  })

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Каталог тестов</span>
          <h1>Каталог тренажёров</h1>
          <p>
            Подберите формат под конкретную задачу: распознавание угроз, приоритизация уязвимостей,
            проверка теории или отработка последовательности действий при инциденте.
          </p>
        </div>
        <div className="page-hero__aside page-hero__aside--stats">
          <div className="card compact-card">
            <strong>{playableTests.length}</strong>
            <span>активных тренажёров</span>
          </div>
          <div className="card compact-card">
            <strong>{tests.filter((test) => test.status === 'draft').length}</strong>
            <span>сценариев в разработке</span>
          </div>
          <div className="card compact-card">
            <strong>
              {awarenessProgress.completed}/{awarenessProgress.total}
            </strong>
            <span>мини-игры пройдено</span>
          </div>
        </div>
        <div className="card compact-card compact-card--progress page-hero__full-progress">
          <div className="compact-card__progress-head">
            <strong>
              {completedTestSlugs.size}/{playableTests.length}
            </strong>
            <span>{trainingProgress}%</span>
          </div>
          <span>тренажёров пройдено</span>
          <div className="compact-card__milestone-row">
            <div className="progress compact-card__progress">
              <span style={{ width: `${trainingProgress}%` }} />
            </div>
            <div className="compact-card__milestones">
              <span className={trainingProgress >= 0 ? 'is-active' : ''}>
                <BookOpen size={15} />
                Старт
              </span>
              <span className={trainingProgress >= 25 ? 'is-active' : ''}>
                <BookCheck size={15} />
                25%
              </span>
              <span className={trainingProgress >= 60 ? 'is-active' : ''}>
                <GraduationCap size={15} />
                60%
              </span>
              <span className={trainingProgress >= 100 ? 'is-active' : ''}>
                <Award size={15} />
                Мастер
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionTitle
          eyebrow="Фильтрация"
          title="Подберите тест под тип навыка"
          description="Поиск и фильтры уже работают. Это упростит масштабирование, когда вы добавите реальные вопросы и сценарии."
        />

        <div className="toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            placeholder="Поиск по названию, описанию или механике"
          />
          <div className="toolbar__chips">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip ${category === item ? 'chip--active' : ''}`}
                onClick={() => startTransition(() => setCategory(item))}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid--cards">
          {filtered.map((test) => (
            <TestCard key={test.slug} test={test} attempts={state.attempts} />
          ))}
        </div>
      </section>
    </div>
  )
}
