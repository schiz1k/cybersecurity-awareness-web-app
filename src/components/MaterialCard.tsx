import { Bookmark, BookmarkCheck, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MaterialItem } from '../types'

export function MaterialCard({
  material,
  bookmarked,
  completed,
  onToggleBookmark,
}: {
  material: MaterialItem
  bookmarked: boolean
  completed: boolean
  onToggleBookmark: () => void
}) {
  return (
    <article className="card material-card">
      <div className="card__meta">
        <span className="pill">{material.category}</span>
        <span>{material.level}</span>
      </div>
      <h3>{material.title}</h3>
      <p>{material.summary}</p>
      <div className="material-card__tags">
        {material.highlights.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="card__footer">
        <span className="material-card__time">
          <Clock3 size={14} />
          {material.readTime}
        </span>
        <div className="material-card__actions">
          {completed ? <span className="status-badge">Пройдено</span> : null}
          <button type="button" className="icon-button" onClick={onToggleBookmark}>
            {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <Link to={`/materials/${material.slug}`} className="button button--ghost">
            Читать
          </Link>
        </div>
      </div>
    </article>
  )
}
