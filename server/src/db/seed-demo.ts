import { materials, tests } from '../../../src/data/siteData.ts'
import { hashPassword } from '../modules/users/auth'
import { pool } from './pool'
import { replaceAllContent } from '../modules/content/content.repository'

interface TeamSeed {
  name: string
  city: string
}

interface UserSeed {
  email: string
  displayName: string
  city: string
  primaryTrack: string
  role: 'student' | 'instructor' | 'admin'
  teamName: string | null
}

interface BookmarkSeed {
  email: string
  materialSlugs: string[]
}

interface ProgressSeed {
  email: string
  materialSlug: string
  status: 'in_progress' | 'completed'
  daysAgo: number
}

interface AttemptSeed {
  email: string
  testSlug: string
  score: number
  label: string
  summary: string
  daysAgo: number
}

const DEMO_ACCOUNT_PASSWORD = 'CyberArena123!'

const teamSeeds: TeamSeed[] = [
  { name: 'Blue Grid', city: 'Самара' },
  { name: 'Threat Forge', city: 'Новосибирск' },
  { name: 'Red Harbor', city: 'Казань' },
  { name: 'Packet North', city: 'Екатеринбург' },
]

const userSeeds: UserSeed[] = [
  {
    email: 'admin@cyberarena.local',
    displayName: 'Администратор платформы',
    city: 'Самара',
    primaryTrack: 'Platform Ops',
    role: 'admin',
    teamName: null,
  },
  {
    email: 'irina.volkova@cyberarena.local',
    displayName: 'Ирина Волкова',
    city: 'Самара',
    primaryTrack: 'SOC Tier 1',
    role: 'student',
    teamName: 'Blue Grid',
  },
  {
    email: 'maksim.ivanov@cyberarena.local',
    displayName: 'Максим Иванов',
    city: 'Казань',
    primaryTrack: 'Threat Hunting',
    role: 'student',
    teamName: 'Red Harbor',
  },
  {
    email: 'anna.petrova@cyberarena.local',
    displayName: 'Анна Петрова',
    city: 'Новосибирск',
    primaryTrack: 'Detection Engineering',
    role: 'student',
    teamName: 'Threat Forge',
  },
  {
    email: 'lev.sokolov@cyberarena.local',
    displayName: 'Лев Соколов',
    city: 'Екатеринбург',
    primaryTrack: 'Blue Team Ops',
    role: 'student',
    teamName: 'Packet North',
  },
  {
    email: 'olga.romanova@cyberarena.local',
    displayName: 'Ольга Романова',
    city: 'Самара',
    primaryTrack: 'AppSec',
    role: 'student',
    teamName: 'Blue Grid',
  },
  {
    email: 'sergey.fomin@cyberarena.local',
    displayName: 'Сергей Фомин',
    city: 'Казань',
    primaryTrack: 'DFIR',
    role: 'student',
    teamName: 'Red Harbor',
  },
  {
    email: 'daria.lebedeva@cyberarena.local',
    displayName: 'Дарья Лебедева',
    city: 'Новосибирск',
    primaryTrack: 'Security Awareness',
    role: 'instructor',
    teamName: 'Threat Forge',
  },
]

const bookmarkSeeds: BookmarkSeed[] = [
  {
    email: 'admin@cyberarena.local',
    materialSlugs: ['phishing-playbook', 'soc-triage-checklist'],
  },
  {
    email: 'irina.volkova@cyberarena.local',
    materialSlugs: ['soc-triage-checklist', 'siem-detection-metrics'],
  },
  {
    email: 'maksim.ivanov@cyberarena.local',
    materialSlugs: ['linux-hardening-roadmap'],
  },
  {
    email: 'anna.petrova@cyberarena.local',
    materialSlugs: ['siem-detection-metrics', 'soc-triage-checklist'],
  },
  {
    email: 'olga.romanova@cyberarena.local',
    materialSlugs: ['phishing-playbook'],
  },
]

const progressSeeds: ProgressSeed[] = [
  { email: 'admin@cyberarena.local', materialSlug: 'phishing-playbook', status: 'completed', daysAgo: 9 },
  { email: 'admin@cyberarena.local', materialSlug: 'soc-triage-checklist', status: 'completed', daysAgo: 5 },
  { email: 'admin@cyberarena.local', materialSlug: 'linux-hardening-roadmap', status: 'in_progress', daysAgo: 2 },
  { email: 'irina.volkova@cyberarena.local', materialSlug: 'soc-triage-checklist', status: 'completed', daysAgo: 6 },
  { email: 'irina.volkova@cyberarena.local', materialSlug: 'siem-detection-metrics', status: 'completed', daysAgo: 3 },
  { email: 'maksim.ivanov@cyberarena.local', materialSlug: 'linux-hardening-roadmap', status: 'completed', daysAgo: 4 },
  { email: 'anna.petrova@cyberarena.local', materialSlug: 'siem-detection-metrics', status: 'completed', daysAgo: 1 },
  { email: 'lev.sokolov@cyberarena.local', materialSlug: 'linux-hardening-roadmap', status: 'in_progress', daysAgo: 1 },
  { email: 'olga.romanova@cyberarena.local', materialSlug: 'phishing-playbook', status: 'completed', daysAgo: 7 },
  { email: 'sergey.fomin@cyberarena.local', materialSlug: 'soc-triage-checklist', status: 'in_progress', daysAgo: 2 },
  { email: 'daria.lebedeva@cyberarena.local', materialSlug: 'phishing-playbook', status: 'completed', daysAgo: 8 },
]

const attemptSeeds: AttemptSeed[] = [
  {
    email: 'admin@cyberarena.local',
    testSlug: 'soc-analyst-quiz',
    score: 842,
    label: 'Стабильный анализ',
    summary: 'Быстрый разбор теории и уверенная работа с базовыми терминами.',
    daysAgo: 4,
  },
  {
    email: 'admin@cyberarena.local',
    testSlug: 'patch-priority',
    score: 861,
    label: 'Почти без потерь',
    summary: 'Высокая скорость приоритизации и хороший темп на критичных задачах.',
    daysAgo: 2,
  },
  {
    email: 'irina.volkova@cyberarena.local',
    testSlug: 'phishing-reflex',
    score: 934,
    label: 'Холодная голова',
    summary: 'Отличает подозрительные сигналы практически без ложных кликов.',
    daysAgo: 1,
  },
  {
    email: 'irina.volkova@cyberarena.local',
    testSlug: 'soc-analyst-quiz',
    score: 901,
    label: 'Сильный фундамент',
    summary: 'Уверенно разбирает triage, containment и качество сигналов.',
    daysAgo: 5,
  },
  {
    email: 'maksim.ivanov@cyberarena.local',
    testSlug: 'breach-chain-memory',
    score: 958,
    label: 'Память на цепочку',
    summary: 'Собирает kill chain без просадок даже под давлением таймера.',
    daysAgo: 1,
  },
  {
    email: 'maksim.ivanov@cyberarena.local',
    testSlug: 'patch-priority',
    score: 889,
    label: 'Жёсткая сортировка',
    summary: 'Хорошо держит баланс между критичностью и бизнес-риском.',
    daysAgo: 7,
  },
  {
    email: 'anna.petrova@cyberarena.local',
    testSlug: 'soc-analyst-quiz',
    score: 915,
    label: 'Точная теория',
    summary: 'Сильный результат на квизе и чистые ответы по detection engineering.',
    daysAgo: 3,
  },
  {
    email: 'anna.petrova@cyberarena.local',
    testSlug: 'phishing-reflex',
    score: 876,
    label: 'Уверенный ритм',
    summary: 'Почти все вредоносные шаблоны распознаны с первого прохода.',
    daysAgo: 6,
  },
  {
    email: 'lev.sokolov@cyberarena.local',
    testSlug: 'patch-priority',
    score: 804,
    label: 'Практичный подход',
    summary: 'Хорошо расставляет задачи в очереди, но теряет темп на финале.',
    daysAgo: 2,
  },
  {
    email: 'lev.sokolov@cyberarena.local',
    testSlug: 'breach-chain-memory',
    score: 782,
    label: 'Есть база',
    summary: 'Верно собирает ядро сценария, но путает поздние этапы атаки.',
    daysAgo: 8,
  },
  {
    email: 'olga.romanova@cyberarena.local',
    testSlug: 'phishing-reflex',
    score: 893,
    label: 'Фильтр писем',
    summary: 'Стабильно отделяет опасные письма от безопасных уведомлений.',
    daysAgo: 2,
  },
  {
    email: 'sergey.fomin@cyberarena.local',
    testSlug: 'breach-chain-memory',
    score: 828,
    label: 'Разбор инцидента',
    summary: 'Хорошо восстанавливает последовательность действий злоумышленника.',
    daysAgo: 3,
  },
  {
    email: 'daria.lebedeva@cyberarena.local',
    testSlug: 'soc-analyst-quiz',
    score: 774,
    label: 'Методичная база',
    summary: 'Уверенно проходит теорию и держит хорошую точность на базовых вопросах.',
    daysAgo: 5,
  },
]

function passwordHashFor() {
  return hashPassword(DEMO_ACCOUNT_PASSWORD)
}

function tierFromScore(score: number) {
  if (score >= 940) return 'Легенда'
  if (score >= 880) return 'Алмаз'
  if (score >= 800) return 'Золото'
  if (score >= 700) return 'Серебро'
  return 'Бронза'
}

function timestampDaysAgo(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
}

async function truncateDemoData() {
  await pool.query(`
    truncate table
      attempt_answers,
      test_attempts,
      user_sessions,
      material_bookmarks,
      material_progress,
      test_question_options,
      test_questions,
      test_deck_items,
      test_benefits,
      material_sections,
      material_highlights,
      tests,
      materials,
      users,
      teams
    restart identity cascade
  `)
}

async function insertTeams() {
  const teamIds = new Map<string, string>()

  for (const team of teamSeeds) {
    const result = await pool.query(
      `
        insert into teams (name, city)
        values ($1, $2)
        returning id
      `,
      [team.name, team.city],
    )

    teamIds.set(team.name, String(result.rows[0].id))
  }

  return teamIds
}

async function insertUsers(teamIds: Map<string, string>) {
  const userIds = new Map<string, string>()

  for (const user of userSeeds) {
    const result = await pool.query(
      `
        insert into users (
          email,
          password_hash,
          display_name,
          city,
          primary_track,
          role,
          team_id
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id
      `,
      [
        user.email,
        passwordHashFor(),
        user.displayName,
        user.city,
        user.primaryTrack,
        user.role,
        user.teamName ? teamIds.get(user.teamName) ?? null : null,
      ],
    )

    userIds.set(user.email, String(result.rows[0].id))
  }

  return userIds
}

async function mapIds(tableName: 'materials' | 'tests') {
  const result = await pool.query(`select id, slug from ${tableName}`)
  const ids = new Map<string, string>()

  for (const row of result.rows) {
    ids.set(String(row.slug), String(row.id))
  }

  return ids
}

async function insertBookmarks(userIds: Map<string, string>, materialIds: Map<string, string>) {
  for (const bookmark of bookmarkSeeds) {
    const userId = userIds.get(bookmark.email)

    if (!userId) {
      continue
    }

    for (const slug of bookmark.materialSlugs) {
      const materialId = materialIds.get(slug)

      if (!materialId) {
        continue
      }

      await pool.query(
        `
          insert into material_bookmarks (user_id, material_id, created_at)
          values ($1, $2, $3)
        `,
        [userId, materialId, timestampDaysAgo(1)],
      )
    }
  }
}

async function insertProgress(userIds: Map<string, string>, materialIds: Map<string, string>) {
  for (const item of progressSeeds) {
    const userId = userIds.get(item.email)
    const materialId = materialIds.get(item.materialSlug)

    if (!userId || !materialId) {
      continue
    }

    const timestamp = timestampDaysAgo(item.daysAgo)

    await pool.query(
      `
        insert into material_progress (
          user_id,
          material_id,
          status,
          completed_at,
          last_read_at
        )
        values ($1, $2, $3, $4, $4)
      `,
      [userId, materialId, item.status, item.status === 'completed' ? timestamp : null],
    )
  }
}

async function insertAttempts(userIds: Map<string, string>, testIds: Map<string, string>) {
  for (const attempt of attemptSeeds) {
    const userId = userIds.get(attempt.email)
    const testId = testIds.get(attempt.testSlug)

    if (!userId || !testId) {
      continue
    }

    const timestamp = timestampDaysAgo(attempt.daysAgo)

    await pool.query(
      `
        insert into test_attempts (
          test_id,
          user_id,
          score,
          label,
          summary,
          tier_name,
          started_at,
          completed_at,
          meta_json
        )
        values ($1, $2, $3, $4, $5, $6, $7, $7, '{}'::jsonb)
      `,
      [
        testId,
        userId,
        attempt.score,
        attempt.label,
        attempt.summary,
        tierFromScore(attempt.score),
        timestamp,
      ],
    )
  }
}

async function logCurrentSnapshot() {
  const [testsCount, materialsCount, usersCount, attemptsCount, leaderboard] = await Promise.all([
    pool.query('select count(*)::int as count from tests'),
    pool.query('select count(*)::int as count from materials'),
    pool.query('select count(*)::int as count from users'),
    pool.query('select count(*)::int as count from test_attempts'),
    pool.query(
      `
        select display_name, best_score, tier_name
        from leaderboard_current
        order by best_score desc, display_name asc
        limit 5
      `,
    ),
  ])

  console.log(
    JSON.stringify(
      {
        tests: testsCount.rows[0].count,
        materials: materialsCount.rows[0].count,
        users: usersCount.rows[0].count,
        attempts: attemptsCount.rows[0].count,
        leaderboardTop5: leaderboard.rows,
        demoAccountPassword: DEMO_ACCOUNT_PASSWORD,
      },
      null,
      2,
    ),
  )
}

async function main() {
  await truncateDemoData()
  await replaceAllContent({ tests, materials })

  const teamIds = await insertTeams()
  const userIds = await insertUsers(teamIds)
  const materialIds = await mapIds('materials')
  const testIds = await mapIds('tests')

  await insertBookmarks(userIds, materialIds)
  await insertProgress(userIds, materialIds)
  await insertAttempts(userIds, testIds)
  await logCurrentSnapshot()
}

void main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
