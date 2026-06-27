import { ArrowRight, Bookmark, BookmarkCheck, ChevronLeft, CheckCircle2, Clock3 } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useContentState } from '../hooks/useContentState'
import { usePlatformState } from '../hooks/usePlatformState'

export function MaterialDetailPage() {
  const { slug } = useParams()
  const { materials, tests } = useContentState()
  const { state, markMaterialComplete, toggleBookmark } = usePlatformState()
  const material = materials.find((item) => item.slug === slug)

  if (!material) {
    return <Navigate to="/materials" replace />
  }

  const bookmarked = state.bookmarkedMaterials.includes(material.slug)
  const completed = state.completedMaterials.includes(material.slug)
  const relatedTests = tests
    .filter((test) => test.status === 'playable' && test.category === material.category)
    .slice(0, 3)

  return (
    <div className="page">
      <section className="detail-hero">
        <div>
          <Link to="/materials" className="detail-hero__back">
            <ChevronLeft size={16} />
            Ко всем материалам
          </Link>
          <span className="eyebrow">{material.category}</span>
          <h1>{material.title}</h1>
          <p>{material.summary}</p>
          <div className="detail-hero__chips">
            <span>{material.level}</span>
            <span>{material.readTime}</span>
            {material.highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="card detail-hero__aside">
          <div className="detail-hero__summary">
            <div>
              <small>Статус</small>
              <strong>{completed ? 'Пройден' : 'В работе'}</strong>
            </div>
            <div>
              <small>Закладка</small>
              <strong>{bookmarked ? 'Сохранён' : 'Не сохранён'}</strong>
            </div>
          </div>
          <div className="detail-hero__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => markMaterialComplete(material.slug)}
            >
              <CheckCircle2 size={16} />
              Отметить как изученный
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => toggleBookmark(material.slug)}
            >
              {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {bookmarked ? 'Убрать из закладок' : 'В закладки'}
            </button>
          </div>
        </div>
      </section>

      <section className="section section--split">
        <article className="card article-card">
          {material.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
        <aside className="detail-column">
          <article className="card feature-card">
            <h3>Ключевые акценты</h3>
            <ul className="stack-list">
              {material.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="card feature-card">
            <h3>Связанные действия</h3>
            {relatedTests.length ? (
              <div className="related-tests">
                {relatedTests.map((test) => (
                  <Link to={`/tests/${test.slug}`} className="related-test-card" key={test.slug}>
                    <span className="pill" style={{ background: `${test.accent}1f`, color: test.accent }}>
                      {test.tag}
                    </span>
                    <strong>{test.title}</strong>
                    <span>{test.description}</span>
                    <small>
                      <Clock3 size={14} />
                      {test.duration}
                    </small>
                    <em>
                      Открыть
                      <ArrowRight size={14} />
                    </em>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p>Для этой темы пока нет отдельной тренировки. Откройте общий каталог тестов.</p>
                <Link to="/tests" className="button button--ghost">
                  Перейти к тестам
                </Link>
              </>
            )}
          </article>
        </aside>
      </section>
    </div>
  )
}
