import { Crown } from 'lucide-react'
import { useState } from 'react'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { SectionTitle } from '../components/SectionTitle'
import { useLeaderboardState } from '../hooks/useLeaderboardState'
import { usePlatformState } from '../hooks/usePlatformState'

export function LeaderboardPage() {
  const { state } = usePlatformState()
  const { leaderboard } = useLeaderboardState()
  const [track, setTrack] = useState('Все')
  const tracks = ['Все', ...new Set(leaderboard.map((item) => item.track))]
  const filtered = leaderboard.filter((entry) => track === 'Все' || entry.track === track)

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Рейтинг</span>
          <h1>Рейтинг участников и команд</h1>
          <p>
            Лучшие результаты по направлениям, командам и городам. Здесь легко увидеть лидеров
            потока и своё текущее место в таблице.
          </p>
        </div>
        <div className="page-hero__aside page-hero__aside--podium">
          {leaderboard.slice(0, 3).map((entry, index) => (
            <div
              key={entry.name}
              className={`card podium-card podium-card--${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}
            >
              <small>
                {index === 0 ? <Crown size={15} /> : null}
                #{index + 1}
              </small>
              <strong>{entry.name}</strong>
              <span>{entry.tier}</span>
              <p>{entry.score} баллов</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle
          eyebrow="Фильтр треков"
          title="Таблица лидеров"
          description="Рейтинг обновляется по лучшим результатам прохождений и помогает сравнивать темп разных направлений."
        />
        <div className="toolbar__chips toolbar__chips--solo">
          {tracks.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${track === item ? 'chip--active' : ''}`}
              onClick={() => setTrack(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <LeaderboardTable entries={filtered} highlightName={state.learnerName} />
      </section>
    </div>
  )
}
