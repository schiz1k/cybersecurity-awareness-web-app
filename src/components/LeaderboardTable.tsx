import type { LeaderboardEntry } from '../types'
import { formatScore } from '../utils/platform'

export function LeaderboardTable({
  entries,
  highlightName,
}: {
  entries: LeaderboardEntry[]
  highlightName?: string
}) {
  return (
    <div className="leaderboard-table">
      <div className="leaderboard-table__head">
        <span>#</span>
        <span>Участник</span>
        <span>Трек</span>
        <span>Уровень</span>
        <span>Баллы</span>
      </div>
      {entries.map((entry, index) => (
        <div
          key={`${entry.name}-${entry.track}`}
          className={`leaderboard-table__row ${
            highlightName === entry.name ? 'leaderboard-table__row--highlight' : ''
          }`}
        >
          <span>{index + 1}</span>
          <div>
            <strong>{entry.name}</strong>
            <small>
              {entry.squad} · {entry.city}
            </small>
          </div>
          <span>{entry.track}</span>
          <span>{entry.tier}</span>
          <span>
            {formatScore(entry.score)} <small>{entry.delta}</small>
          </span>
        </div>
      ))}
    </div>
  )
}
