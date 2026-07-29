-- Faza 1 / Dzien 1: schemat MVP + constraints + indeksy bazowe
-- Zakres: DDL tabel, FK, unikalnosci, check constraints, indeksy pod zapytania quizowe.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  unlock_cost integer not null default 0 check (unlock_cost >= 0),
  difficulty_weight integer not null default 1 check (difficulty_weight > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  tier text not null check (tier in ('easy', 'hard', 'expert')),
  source_word text not null,
  target_word text not null,
  distractor_group text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, tier, source_word),
  unique (category_id, tier, target_word)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_category_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  constraint uq_user_category_unlocks_user_category unique (user_id, category_id)
);

create table if not exists public.user_word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  tier text not null check (tier in ('easy', 'hard', 'expert')),
  correct_count integer not null default 0 check (correct_count >= 0),
  required_correct integer not null default 3 check (required_correct >= 3),
  wrong_count integer not null default 0 check (wrong_count >= 0),
  mastered boolean not null default false,
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ck_user_word_progress_required_correct_max check (required_correct <= 13),
  constraint uq_user_word_progress_user_word_tier unique (user_id, word_id, tier)
);

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  tier text not null check (tier in ('easy', 'hard', 'expert')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer check (score is null or score >= 0),
  accuracy numeric(5,2) check (accuracy is null or (accuracy >= 0 and accuracy <= 100)),
  status text not null default 'in_progress' check (status in ('in_progress', 'finished', 'abandoned'))
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete restrict,
  selected_option text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create table if not exists public.user_wallet (
  user_id uuid primary key references auth.users (id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  delta integer not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

-- Dzien 1: wymagane indeksy bazowe pod flow quizu/progresji.
create index if not exists idx_user_word_progress_user_tier_mastered
  on public.user_word_progress (user_id, tier, mastered);

create index if not exists idx_quiz_sessions_user_started_at_desc
  on public.quiz_sessions (user_id, started_at desc);

create index if not exists idx_points_ledger_user_created_at_desc
  on public.points_ledger (user_id, created_at desc);

-- Dodatkowe praktyczne indeksy pod odczyt katalogu i historii odpowiedzi.
create index if not exists idx_words_category_tier_active
  on public.words (category_id, tier, is_active);

create index if not exists idx_quiz_answers_session_answered_at
  on public.quiz_answers (session_id, answered_at desc);
