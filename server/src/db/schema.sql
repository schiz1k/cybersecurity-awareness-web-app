create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('student', 'instructor', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'test_mode') then
    create type test_mode as enum ('reflex', 'sequence', 'priority', 'quiz');
  end if;
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type content_status as enum ('draft', 'playable', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'difficulty_level') then
    create type difficulty_level as enum ('base', 'medium', 'advanced');
  end if;
  if not exists (select 1 from pg_type where typname = 'progress_status') then
    create type progress_status as enum ('not_started', 'in_progress', 'completed');
  end if;
end $$;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  city text,
  primary_track text,
  role app_role not null default 'student',
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  level difficulty_level not null default 'base',
  read_time_minutes integer not null check (read_time_minutes > 0),
  read_time_label text not null,
  summary text not null,
  status content_status not null default 'draft',
  author_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists material_highlights (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  sort_order integer not null,
  value text not null
);

create table if not exists material_sections (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  sort_order integer not null,
  title text,
  body_markdown text not null
);

create table if not exists material_bookmarks (
  user_id uuid not null references users(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create table if not exists material_progress (
  user_id uuid not null references users(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  status progress_status not null default 'not_started',
  completed_at timestamptz,
  last_read_at timestamptz,
  primary key (user_id, material_id)
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  headline text not null,
  tag text not null,
  category text not null,
  description text not null,
  difficulty difficulty_level not null default 'base',
  duration_minutes integer not null check (duration_minutes > 0),
  duration_label text not null,
  metric_label text not null,
  accent_color varchar(7) not null,
  mode test_mode not null,
  status content_status not null default 'draft',
  config_json jsonb not null default '{}'::jsonb,
  author_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists test_benefits (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  sort_order integer not null,
  value text not null
);

create table if not exists test_deck_items (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  sort_order integer not null,
  value text not null
);

create table if not exists test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  prompt text not null,
  explanation text,
  sort_order integer not null
);

create table if not exists test_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references test_questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  sort_order integer not null
);

create table if not exists test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score integer not null check (score >= 0),
  label text not null,
  summary text not null,
  tier_name text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  meta_json jsonb not null default '{}'::jsonb
);

create table if not exists attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references test_attempts(id) on delete cascade,
  question_id uuid not null references test_questions(id) on delete cascade,
  selected_option_id uuid references test_question_options(id) on delete set null,
  is_correct boolean not null default false
);

create or replace view leaderboard_current as
with best_attempts as (
  select
    ta.user_id,
    max(ta.score) as best_score
  from test_attempts ta
  group by ta.user_id
)
select
  u.id as user_id,
  u.display_name,
  u.city,
  u.primary_track,
  coalesce(t.name, 'Без команды') as team_name,
  coalesce(ba.best_score, 0) as best_score,
  case
    when coalesce(ba.best_score, 0) >= 940 then 'Легенда'
    when coalesce(ba.best_score, 0) >= 880 then 'Алмаз'
    when coalesce(ba.best_score, 0) >= 800 then 'Золото'
    when coalesce(ba.best_score, 0) >= 700 then 'Серебро'
    else 'Бронза'
  end as tier_name
from users u
left join teams t on t.id = u.team_id
left join best_attempts ba on ba.user_id = u.id;
