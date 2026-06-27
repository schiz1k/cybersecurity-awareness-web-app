import { pool } from '../../db/pool'

export async function listCurrentLeaderboard() {
  const result = await pool.query(
    `
      select
        row_number() over (order by best_score desc, display_name asc) as rank,
        display_name as name,
        coalesce(team_name, 'Без команды') as squad,
        coalesce(city, 'Не указан') as city,
        coalesce(primary_track, 'Custom') as track,
        tier_name as tier,
        best_score as score
      from leaderboard_current
      order by best_score desc, display_name asc
      limit 100
    `,
  )

  return result.rows
}
