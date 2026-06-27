import { pool } from './pool'

export async function ensureSchema() {
  await pool.query(`
    create table if not exists user_sessions (
      token text primary key,
      user_id uuid not null references users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      revoked_at timestamptz
    );

    create index if not exists user_sessions_user_id_idx
      on user_sessions (user_id);

    create index if not exists user_sessions_expires_at_idx
      on user_sessions (expires_at);
  `)
}
