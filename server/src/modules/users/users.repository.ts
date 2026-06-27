import { createSessionToken } from './auth'
import { pool } from '../../db/pool'
import { HttpError } from '../../http/httpError'
import { ensureMaterialIdBySlug, ensureTestIdBySlug } from '../content/content.repository'
import type { PlatformState, StoredAttempt } from '../../../src/types'

export interface CreateUserInput {
  email: string
  passwordHash: string
  displayName: string
  city?: string
  teamId?: string | null
  primaryTrack?: string | null
  role?: 'student' | 'instructor' | 'admin'
}

export interface AuthenticatedUser {
  id: string
  email: string
  password_hash: string
  display_name: string
  city: string | null
  primary_track: string | null
  role: 'student' | 'instructor' | 'admin'
  team_id: string | null
}

export async function createUser(input: CreateUserInput) {
  const result = await pool.query(
    `
      insert into users (
        email,
        password_hash,
        display_name,
        city,
        team_id,
        primary_track,
        role
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, email, display_name, city, primary_track, role, team_id, created_at
    `,
    [
      input.email.toLowerCase(),
      input.passwordHash,
      input.displayName,
      input.city ?? null,
      input.teamId ?? null,
      input.primaryTrack ?? null,
      input.role ?? 'student',
    ],
  )

  return result.rows[0]
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    `
      select id, email, password_hash, display_name, city, primary_track, role, team_id
      from users
      where email = $1
      limit 1
    `,
    [email.toLowerCase()],
  )

  return result.rows[0] ?? null
}

export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const result = await pool.query(
    `
      select id, email, password_hash, display_name, city, primary_track, role, team_id
      from users
      where id = $1
      limit 1
    `,
    [id],
  )

  return (result.rows[0] as AuthenticatedUser | undefined) ?? null
}

export async function getUserBySessionToken(token: string): Promise<AuthenticatedUser | null> {
  const result = await pool.query(
    `
      select
        u.id,
        u.email,
        u.password_hash,
        u.display_name,
        u.city,
        u.primary_track,
        u.role,
        u.team_id
      from user_sessions s
      join users u on u.id = s.user_id
      where s.token = $1
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
    `,
    [token],
  )

  return (result.rows[0] as AuthenticatedUser | undefined) ?? null
}

export async function createUserSession(userId: string) {
  const token = createSessionToken()

  await pool.query(
    `
      insert into user_sessions (token, user_id, expires_at)
      values ($1, $2, now() + interval '30 days')
    `,
    [token, userId],
  )

  return token
}

export async function revokeSession(token: string) {
  await pool.query(
    `
      update user_sessions
      set revoked_at = now()
      where token = $1 and revoked_at is null
    `,
    [token],
  )
}

export async function requireCurrentUserById(userId: string) {
  const existing = await getUserById(userId)

  if (existing) {
    return existing
  }

  throw new HttpError(401, 'Пользователь не найден.')
}

function mapAttempts(rows: Array<Record<string, unknown>>): StoredAttempt[] {
  return rows.map((row) => ({
    id: String(row.id),
    testSlug: String(row.test_slug),
    score: Number(row.score),
    label: String(row.label),
    summary: String(row.summary),
    tier: row.tier_name as StoredAttempt['tier'],
    createdAt: String(row.completed_at),
  }))
}

export async function getUserStateById(userId: string): Promise<PlatformState> {
  const user = await requireCurrentUserById(userId)

  const [bookmarks, progress, attempts] = await Promise.all([
    pool.query(
      `
        select m.slug
        from material_bookmarks mb
        join materials m on m.id = mb.material_id
        where mb.user_id = $1
        order by mb.created_at desc
      `,
      [user.id],
    ),
    pool.query(
      `
        select m.slug
        from material_progress mp
        join materials m on m.id = mp.material_id
        where mp.user_id = $1 and mp.status = 'completed'
        order by mp.completed_at desc nulls last
      `,
      [user.id],
    ),
    pool.query(
      `
        select ta.id, t.slug as test_slug, ta.score, ta.label, ta.summary, ta.tier_name, ta.completed_at
        from test_attempts ta
        join tests t on t.id = ta.test_id
        where ta.user_id = $1
        order by ta.completed_at desc
        limit 30
      `,
      [user.id],
    ),
  ])

  return {
    accountEmail: String(user.email),
    learnerName: String(user.display_name ?? 'Ваш профиль'),
    role: String(user.primary_track ?? 'Cybersecurity Team'),
    bookmarkedMaterials: bookmarks.rows.map((row) => String(row.slug)),
    completedMaterials: progress.rows.map((row) => String(row.slug)),
    attempts: mapAttempts(attempts.rows),
  }
}

export async function updateCurrentUserById(
  userId: string,
  payload: { learnerName: string; role: string },
) {
  const user = await requireCurrentUserById(userId)
  await pool.query(
    `
      update users
      set display_name = $2,
          primary_track = $3,
          updated_at = now()
      where id = $1
    `,
    [user.id, payload.learnerName, payload.role],
  )

  return getUserStateById(userId)
}

export async function toggleBookmarkByUserId(userId: string, materialSlug: string) {
  const user = await requireCurrentUserById(userId)
  const materialId = await ensureMaterialIdBySlug(materialSlug)
  const existing = await pool.query(
    'select 1 from material_bookmarks where user_id = $1 and material_id = $2',
    [user.id, materialId],
  )

  if (existing.rows[0]) {
    await pool.query('delete from material_bookmarks where user_id = $1 and material_id = $2', [
      user.id,
      materialId,
    ])
  } else {
    await pool.query(
      'insert into material_bookmarks (user_id, material_id) values ($1, $2) on conflict do nothing',
      [user.id, materialId],
    )
  }

  return getUserStateById(userId)
}

export async function markMaterialCompleteByUserId(userId: string, materialSlug: string) {
  const user = await requireCurrentUserById(userId)
  const materialId = await ensureMaterialIdBySlug(materialSlug)

  await pool.query(
    `
      insert into material_progress (user_id, material_id, status, completed_at, last_read_at)
      values ($1, $2, 'completed', now(), now())
      on conflict (user_id, material_id)
      do update set
        status = 'completed',
        completed_at = now(),
        last_read_at = now()
    `,
    [user.id, materialId],
  )

  return getUserStateById(userId)
}

function tierFromScore(score: number) {
  if (score >= 940) return 'Легенда'
  if (score >= 880) return 'Алмаз'
  if (score >= 800) return 'Золото'
  if (score >= 700) return 'Серебро'
  return 'Бронза'
}

export async function createAttemptByUserId(
  userId: string,
  testSlug: string,
  payload: { score: number; label: string; summary: string },
) {
  const user = await requireCurrentUserById(userId)
  const testId = await ensureTestIdBySlug(testSlug)

  await pool.query(
    `
      insert into test_attempts (test_id, user_id, score, label, summary, tier_name, meta_json)
      values ($1, $2, $3, $4, $5, $6, '{}'::jsonb)
    `,
    [testId, user.id, payload.score, payload.label, payload.summary, tierFromScore(payload.score)],
  )

  return getUserStateById(userId)
}
