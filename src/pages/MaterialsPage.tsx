import { startTransition, useDeferredValue, useRef, useState } from 'react'
import { Award, BookCheck, BookOpen, GraduationCap } from 'lucide-react'
import { MaterialCard } from '../components/MaterialCard'
import { SectionTitle } from '../components/SectionTitle'
import { learningTopics } from '../data/siteData'
import { useContentState } from '../hooks/useContentState'
import { usePlatformState } from '../hooks/usePlatformState'

export function MaterialsPage() {
  const { materials } = useContentState()
  const { state, toggleBookmark } = usePlatformState()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Все')
  const materialsSectionRef = useRef<HTMLElement | null>(null)
  const deferredQuery = useDeferredValue(query)
  const categories = ['Все', ...new Set(materials.map((material) => material.category))]
  const completedMaterials = materials.filter((material) =>
    state.completedMaterials.includes(material.slug),
  ).length
  const materialProgress = materials.length ? Math.round((completedMaterials / materials.length) * 100) : 0

  const filtered = materials.filter((material) => {
    const matchesCategory = category === 'Все' || material.category === category
    const matchesQuery =
      deferredQuery.length === 0 ||
      `${material.title} ${material.summary} ${material.highlights.join(' ')}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase())

    return matchesCategory && matchesQuery
  })

  const openTopicMaterials = (topicTitle: string) => {
    setQuery('')
    startTransition(() => setCategory(topicTitle))
    requestAnimationFrame(() => {
      materialsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">База знаний</span>
          <h1>Материалы, playbook и обучающие статьи</h1>
          <p>
            Библиотека статей, чек-листов и playbook для командного обучения, онбординга и
            регулярной практики.
          </p>
        </div>
        <div className="page-hero__aside">
          <div className="card compact-card">
            <strong>{materials.length}</strong>
            <span>материалов в библиотеке</span>
          </div>
          <div className="card compact-card">
            <strong>{state.bookmarkedMaterials.length}</strong>
            <span>закладок в профиле</span>
          </div>
        </div>
        <div className="card compact-card compact-card--progress page-hero__full-progress">
          <div className="compact-card__progress-head">
            <strong>
              {completedMaterials}/{materials.length}
            </strong>
            <span>{materialProgress}%</span>
          </div>
          <span>материалов изучено</span>
          <div className="compact-card__milestone-row">
            <div className="progress compact-card__progress">
              <span style={{ width: `${materialProgress}%` }} />
            </div>
            <div className="compact-card__milestones">
              <span className={materialProgress >= 0 ? 'is-active' : ''}>
                <BookOpen size={15} />
                Старт
              </span>
              <span className={materialProgress >= 25 ? 'is-active' : ''}>
                <BookCheck size={15} />
                25%
              </span>
              <span className={materialProgress >= 60 ? 'is-active' : ''}>
                <GraduationCap size={15} />
                60%
              </span>
              <span className={materialProgress >= 100 ? 'is-active' : ''}>
                <Award size={15} />
                Мастер
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionTitle
          eyebrow="Темы"
          title="Учебные темы по кибербезопасности"
          description="Каждая карточка собирает материалы и тренировки по одному бытовому навыку безопасности."
        />

        <div className="grid grid--cards topic-grid">
          {learningTopics.map((topic) => (
            <article className="card topic-card" key={topic.title}>
              <div className="card__meta">
                <span className="pill">{topic.level}</span>
                <span>{topic.duration}</span>
              </div>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <div className="topic-card__stats">
                <span>{topic.materialSlugs.length} материала</span>
                <span>{topic.trainingSlugs.length} тренировки</span>
              </div>
              <div className="card__footer">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => openTopicMaterials(topic.title)}
                >
                  К изучению
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" ref={materialsSectionRef}>
        <SectionTitle
          eyebrow="Навигация"
          title="Найдите материал под задачу"
          description="Фильтры помогают быстро перейти к нужной теме, уровню и формату изучения."
        />

        <div className="toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            placeholder="Поиск по статье, теме или ключевому слову"
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
          {filtered.map((material) => (
            <MaterialCard
              key={material.slug}
              material={material}
              bookmarked={state.bookmarkedMaterials.includes(material.slug)}
              completed={state.completedMaterials.includes(material.slug)}
              onToggleBookmark={() => toggleBookmark(material.slug)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
